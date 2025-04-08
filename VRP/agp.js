// Copyright © 2019 Aeroterra S.A. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  "dojo/request",
  "dojo/Deferred"
  ],
  function (request, Deferred, arcgisPortal) {

  var agp = {};
  agp.setup = function(options){

    agp.portal = {
      host : options.host,
      protocol : options.protocol || 'https',
    }
    agp.portal.port = options.port || (agp.portal.protocol == 'https' ? 443 : 80);
    agp.portal.endpoints = {
      appToken : '/portal/sharing/rest/oauth2/token?f=json',
      token    : '/portal/sharing/generateToken?f=json'
    }
    agp.portal.users = {
      endpoints : {
        list : '/portal/sharing/rest/portals/self/users?start=!{start}&num=!{num}',
        roles : '/portal/sharing/rest/portals/self/roles?start=!{start}&num=!{num}',
        details : '/portal/sharing/rest/community/users/!{user}'
      }
    }

    agp.portal.token = {
      host : 'os.hostname()',
      port : 78945
    }
  } 

  agp._validateConfig = function(){
    if(!agp.portal)
      throw new Error('Invalid module setup. Missing portal configuration.')
    if(!agp.portal.host)
      throw new Error('Invalid module setup. Missing portal host configuration.')
    if(!agp.portal.port)
      throw new Error('Invalid module setup. Missing portal port configuration.')
    if(!agp.portal.protocol)
      throw new Error('Invalid module setup. Missing portal protocol configuration.')
  }

  agp.getAppToken = function(clientId, clientSecret, remember){
    if(remember){
      agp.appId     = clientId;
      agp.appSecret = clientSecret;
    }
    return new Promise((resolve, reject) =>{
      agp._validateConfig();
      var postData = 'client_id='+ (clientId || agp.appId)
          + '&client_secret='+ (clientSecret || agp.appSecret)
          + '&grant_type=authorization_code' //'client_credentials'
          + '&expiration=' + (17*60)
      var optionsget = {
        host   : agp.portal.host,
        port   : agp.portal.port,
        method : 'POST',
        path   : agp.portal.endpoints.appToken, // here only the domain name,
        headers:{
          "content-type": "application/x-www-form-urlencoded",
          "accept": "application/json",
          'Content-Length': Buffer.byteLength(postData, 'utf8')
        }
      };
      var reqGet = https.request(optionsget, function(res) {
        
        var fullData = '';
        res.on('data', function(d) {
            fullData += d;
        });
        res.on('end', function() {
          try{
            var oJob = JSON.parse(fullData)
            if(res.statusCode.toString()[0] == '2' && !oJob.error)
              resolve(oJob)
            else{
              var err = {};
              if(oJob.error)
                err = oJob;
              else
                err.error = oJob;
              
              reject(err);
            }  
          }
          catch(err){
            reject(err);
          }
        });
      });
      reqGet.setTimeout(300000);
      var buf = Buffer.from(postData)
      reqGet.write(buf.toString('utf8'));
      reqGet.end();
      reqGet.on('error', function(e) {
          console.error(e);
          reject(e)
      });
    });
  }

  agp.getToken = function(user, pass, remember){
    if(remember){
      agp.appId     = user;
      agp.appSecret = pass;
    }
    var getTokenDef = new Deferred();
    // return new Promise((resolve, reject) =>{
    try{
      agp._validateConfig();
      var postData = 'username='+ (user || agp.appId)
          + '&password='+ (pass || agp.appSecret)
          + '&referer=' + window.location.href //'client_credentials'
      var _url = agp.portal.protocol + '://' + agp.portal.host + ':' + agp.portal.port  + agp.portal.endpoints.token
      var optionsget = {
        preventCache : true,
        method : 'POST',
        data   : postData,
        handleAs : 'json',
        headers: {
          "X-Requested-With": null
        }
      };

      request(_url, optionsget).then(function(data){
        getTokenDef.resolve(data)
      }, function(err){
        getTokenDef.reject(err)
      }, function(evt){
        // handle a progress event
      });
    }
    catch(err){
      getTokenDef.reject(err)
    }

    return getTokenDef.promise;
  }

  agp.users = {};
  agp.users._list = function(start, num, token){
    var _listDef = new Deferred();

    try{
      start = start || 1;
      num   = num   || 50;
      agp._validateConfig();
      
      var _url = agp.portal.protocol + '://' + agp.portal.host + ':' + agp.portal.port  + 
              agp.portal.users.endpoints.list.replace(/\!\{start\}/, start).replace(/\!\{num\}/, num) + '&f=json&token=' + token
      var optionsget = {
        method : 'GET',
        handleAs : 'json',
        headers: {
          "X-Requested-With": null
        }
      };

      request(_url, optionsget).then(function(data){
        _listDef.resolve(data)
      }, function(err){
        _listDef.reject(err)
      }, function(evt){
        // handle a progress event
      });
    }
    catch(err){
      _listDef.reject(err)
    }
    return _listDef.promise;
  }

  agp.users.list = function(simplify, token){
    if(typeof(simplify) == "string" && token == undefined)
      token = simplify;
    var listDef = new Deferred();
    try{
      var start = 1;
      var num   = 20;
      var users = [];
      var _fnc = function(){
        agp.users._list(start, num, token).then(function(data) {
          if(data && data.users){
            //console.log('\x1b[33m\x1b[1m-->\x1b[0m', data.users.length)
            if(simplify){
              data.users.forEach(function(u) {
                users.push({
                  role      : u.role,
                  level     : u.level,
                  access    : u.access,
                  username  : u.username,
                  fullName  : u.fullName,
                  firstName : u.firstName,
                  lastName  : u.lastName,
                  disabled  : u.disabled,
                  userType  : u.userType,
                  email     : u.email
                });
              })  
            }
            else{
              data.users.forEach(u => {
                users.push(u);
              })
            }
            
            if(data.nextStart > 0){
              start = data.nextStart;
              _fnc();
            }
            else
              listDef.resolve(users)
          }
        }).catch(err => {
          listDef.reject(err)
        });
      }

      _fnc();
    }
    catch(err){
      listDef.reject(err)
    }
    return listDef.promise;
    
  }

  agp.users._roles = function(start, num, token){
    var _rolesDef = new Deferred();

    try{
      start = start || 1;
      num   = num   || 50;
      agp._validateConfig();
      
      var _url = agp.portal.protocol + '://' + agp.portal.host + ':' + agp.portal.port  + 
              agp.portal.users.endpoints.roles.replace(/\!\{start\}/, start).replace(/\!\{num\}/, num) + '&f=json&token=' + token
      var optionsget = {
        method : 'GET',
        handleAs : 'json',
        headers: {
          "X-Requested-With": null
        }
      };

      request(_url, optionsget).then(function(data){
        _rolesDef.resolve(data)
      }, function(err){
        _rolesDef.reject(err)
      }, function(evt){
        // handle a progress event
      });
    }
    catch(err){
      _rolesDef.reject(err)
    }
    return _rolesDef.promise;
  }

  agp.users.details = function(user, token){
    var _rolesDef = new Deferred();

    try{
      agp._validateConfig();
      
      var _url = agp.portal.protocol + '://' + agp.portal.host + ':' + agp.portal.port  + 
              agp.portal.users.endpoints.details.replace(/\!\{user\}/, user) + '?f=json&token=' + token
      var optionsget = {
        method : 'GET',
        handleAs : 'json',
        headers: {
          "X-Requested-With": null
        }
      };

      request(_url, optionsget).then(function(data){
        _rolesDef.resolve(data)
      }, function(err){
        _rolesDef.reject(err)
      }, function(evt){
        // handle a progress event
      });
    }
    catch(err){
      _rolesDef.reject(err)
    }
    return _rolesDef.promise;
  }

  agp.users.roles = function(token){
    var rolesDef = new Deferred();
    try{
      var start = 1;
      var num   = 20;
      var roles = [];
      var _fnc = function(){
        agp.users._roles(start, num, token).then(function(data) {
          if(data && data.roles){
          
            data.roles.forEach(function(u){
              roles.push(u);
            })
            if(data.nextStart > 0){
              start = data.nextStart;
              _fnc();
            }
            else
              rolesDef.resolve(roles)
          }
        }).catch(function(err){
          rolesDef.reject(err)
        });
      }

      _fnc();
    }
    catch(err){
      rolesDef.reject(err)
    }
    return rolesDef.promise;    
  }

  agp.users.groups = function(token){
    var groupsDef = new Deferred();
    try{
      agp.users.list(true, token).then(dUsers => {
        //console.log(dUsers)
        var arr = dUsers;
        var dic = {};
        var _fnc = function(){
          if(arr.length){
            var u = arr.pop();
            agp.users.details(u.username, token).then(function(dets) {
              //console.log(dets)
              if(dets && dets.groups){
                dets.groups.forEach(function(g) {
                  if(!dic[g.id]) dic[g.id] = g;
                })
              }
              _fnc();
            }).catch(function(err) {
              _fnc();
            })
          }
          else{
            var groups = []
            for(var d in dic){
              groups.push(dic[d]);
            }

            groupsDef.resolve(groups);
          }
        }
        _fnc();
      }).catch(function(err) {
        groupsDef.reject(err)
      })
    }
    catch(err){
      groupsDef.reject(err)
    }
    return groupsDef.promise;    
  }

  return agp;

})