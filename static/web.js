
var socket;

var speechWrap = document.getElementById('speechWrap');
var roomWrap = document.getElementById('roomWrap');
var status = document.getElementById('status');
var input = document.getElementById('input');
var btnSend = document.getElementById('btnSend');
var roomName = '';

// 로그인
var LoginComp = (function () {
  return {
    init: function () {
      this.cache();
      this.bindEvents();

      this.$name.focus();

      return this;
    },
    cache: function () {
      this.$name = $('#name');
      this.$channelName = $('#channelName');
      this.$btnCreateChannel = $('#btn_create');
      this.$btnExit = $('#btn_exit');
    },
    bindEvents: function () {
      var self = this;
      this.$btnCreateChannel.on('click', function () {
        LoginComp.join();
      });

      this.$channelName.on('keypress', function (e) {
        if (e.keyCode === 13) {
          LoginComp.join();
        }
      });

      this.$btnExit.on('click', function (e) {

      });
    },
    join: function () {
      var name = this.$name.val();
      var channelName = this.$channelName.val();

      if (name && channelName) {
        SocketChannel.joinChannel(channelName, name);
      }
    }
  }
})().init();

// 소켓 채널
var SocketChannel = (function () {
  var SOCKET_SERVER_HOST = 'localhost';
  var SOCKET_SERVER_PORT = '3001';

  return {
    init: function () {
      return this;
    },
    getConnection: function () {
      if (!socket || !socket.connected) {
        socket = io.connect(`http://${SOCKET_SERVER_HOST}:${SOCKET_SERVER_PORT}`);
      }

      return socket;
    },
    createChannel: function (channelName, name) {
      var socket = this.getConnection();

      socket.emit('create-channel', {
        channelName: channelName,
        name: name,
      });
    },
    destroyChannel: function (channelName, id) {
      var socket = this.getConnection();

      socket.emit('destroy-channel', {
        channelName: channelName,
        id: id,
      });
    },
    joinChannel: function (channelName, name) {
      var socket = this.getConnection();

      socket.emit('join-channel', {
        channelName: channelName,
        name: name,
      });
    },
    leaveChannel: function (channelName, id) {
      var socket = this.getConnection();

      socket.emit('leave-channel', {
        channelName: channelName,
        id: id,
      });
    },
    mountSocketClient: function () {
      var socket = this.getConnection();

      socket.on('join-channel', function (data) {
        // 내가 조인 된거라면
        if (socket.id === data.joinUser.id) {
          $('#login_wrap').hide();
          $('#room_wrap').fadeIn();

          $('#tabs').tabs();
          $('#sortable-left, #sortable-right').sortable({
            connectWith: ".connectedSortable"
          }).disableSelection();

          $('.alert .alert-name').text(data.joinUser.name);
          $('.alert .alert-message').text("님 반갑습니다.");
          $('.alert').fadeIn();
          $('#channel_name').text(data.channelName);
          data.roomUsers.forEach(function (user) {
            var template = [
              '<li class="ui-state-default" data-id="' + user.id + '">',
                '<div class="media">',
                  '<img src="' + user.avatar + '" class="align-self-start mr-3" width="150" height="150" />',
                '<div class="media-body">',
                  '<h5 class="mt-0">' + user.name + '</h5>',
                  '<p class="message-box"></p>',
                '</div>',
              '</div>',
            '</li>'
            ].join('\n')

            if($('#sortable-left li').length >= 5) {
              $('#sortable-right').append(template);
            } else {
              $('#sortable-left').append(template);
            }
          })

          $('.table-meeting-notes tbody').append('<tr><td colspan="2" class="text-center">' + data.joinUser.name + '님이 회의에 참석하였습니다.</td><td>' + data.joinUser.joinedAt.split(' ')[1] + '</td></tr>');

          setTimeout(function () {
            $('.alert').fadeOut();
          }, 2000);

          Speech.bindSpeech();
        // 다른 유저가 조인
        } else {
          var userCount = data.userCount;
          var joinedUserName = data.joinUser.name;

          $('.alert .alert-name').text(joinedUserName);
          $('.alert .alert-message').text("님이 회의에 참석하였습니다.");
          $('.alert').fadeIn();

          $('.table-meeting-notes tbody').append('<tr><td colspan="2" class="text-center">' + data.joinUser.name + '님이 회의에 참석하였습니다.</td><td>' + data.joinUser.joinedAt.split(' ')[1] + '</td></tr>')

          setTimeout(function () {
            $('.alert').fadeOut();
          }, 2000);

          var user = data.joinUser;

          var template = [
            '<li class="ui-state-default" data-id="' + user.id + '">',
              '<div class="media">',
                '<img src="' + user.avatar + '" class="align-self-start mr-3">',
                '<div class="media-body">',
                  '<h5 class="mt-0">' + user.name + '</h5>',
                  '<p class="message-box"></p>',
                '</div>',
              '</div>',
            '</li>'
          ].join('\n')

          if($('#sortable-left li').length >= 5) {
            $('#sortable-right').append(template);
          } else {
            $('#sortable-left').append(template);
          }
        }
      });

      socket.on('destroy-channel', function (data) {
        console.log('destroy-channel : ', data);
      });

      socket.on('leave-channel', function (data) {
        console.log('leave-channel : ', data);

        var id = data.leaveUser.id;
        var leavedAt = data.leaveUser.leavedAt;
        var name = $('[data-id=' + id +']').find('.mt-0').text();

        $('.table-meeting-notes tbody').append('<tr><td colspan="2" class="text-center">' + name + '님이 회의를 종료하였습니다. </td><td>' + leavedAt + '</td></tr>');
        $('[data-id=' + id +']').remove();
      });

      socket.on('message-channel', (data) => {
        console.log(data.id, data.command, data.message);

        messageBox.handleMessageBox(data.id, data.command, data.message);

        if (data.command === 'final') {
          var $userBox = $('[data-id=' + data.id + ']');
          var avatarSrc = $userBox.find('.media img').attr('src');
          var name = $userBox.find('.media-body .mt-0').text();
          var tr = [
            '<tr>',
              '<td>',
                '<img src="' + avatarSrc + '" width="50" height="50" class="align-self-start mr-3" >',
                '<span>' + name + '</span>',
              '</td>',
              '<td>' + data.message + '</td>',
              '<td class="text-center">' + data.receivedAt + '</td>',
            '</tr>',
          ]
          $('.table-meeting-notes').find('tbody').append(tr.join('\n'));
        }
      });
    },
  }
})().init();

SocketChannel.mountSocketClient();

var Speech = (function () {
  return {
    init: function () {
      this.recognizing = false;
      this.ignore_onend = false;

      return this;
    },
    bindSpeech: function () {
      var recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onstart = function() {
        this.recognizing = true;
      };

      recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
          this.ignore_onend = true;
        }
        if (event.error == 'audio-capture') {
          this.ignore_onend = true;
        }
        if (event.error == 'not-allowed') {
          this.ignore_onend = true;
        }
      };

      recognition.onend = function() {
        this.recognizing = false;

        recognition.start();

        console.log('recognition.onend');
      };

      recognition.onresult = function(event) {
        var interim_transcript = '';
        var isFinal = false;
        var message = "";

        var socket = SocketChannel.getConnection();
        var id = socket.id;

        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            isFinal = true;
            message += event.results[i][0].transcript;
          } else {
            message += event.results[i][0].transcript;
          }
        }

        messageBox.handleMessageBox(id, isFinal? 'final' : 'interim', message);

        socket.emit('message-channel', {
          command: isFinal? 'final' : 'interim',
          id: socket.id,
          channelName: LoginComp.$channelName.val(),
          message: message
        })
      };

      recognition.start();
    }
  }
})().init();

var messageBox = {
  handleMessageBox: function (id, command, message) {
    if (  command === 'final') {
      $('[data-id=' + id + ']').removeClass('recognizing');
    } else {
      $('[data-id=' + id + ']').addClass('recognizing');
    }

    $('[data-id=' + id + ']').find('.message-box').text(message);
  },
}
