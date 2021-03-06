
window.onload = function() {
    var chat = new Chat();
    chat.init();
};
var Chat = function() {
    this.socket = null;
};
Chat.prototype = {
    init: function() {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = 'Nickname：（2-10 letters or numbers）';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = 'Nickname is repeated!';
        });
        this.socket.on('nickFoul', function() {
            document.getElementById('info').textContent = 'Input error: must be 2-10 letters or numbers!';
        });
        this.socket.on('loginSuccess', function() {
            document.title = 'X-Chat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });
        this.socket.on('error', function(err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = 'Connection error, SORRY!';
            } else {
                document.getElementById('info').textContent = 'Connection error, SORRY!';
            }
        });
        this.socket.on('system', function(nickName, users, type) {
            var msg = nickName + (type == 'login' ? ' JOIN' : ' LEFT');
            that._displayNewMsg('system', msg, '#9e9e9e');
            document.getElementById('status').textContent = users.length + (users.length > 1 ? ' users' : ' user') + ' online';
            document.getElementById('username').textContent = nickName;
            if(type == 'login') {
                document.getElementById('list').innerHTML = '';
                for (var i = 0; i < users.length; i++) {
                    var li = document.createElement('li');
                    li.innerHTML = users[i];
                    li.setAttribute('id', users[i]);
                    document.getElementById('list').appendChild(li);
                }

            } else {
                document.getElementById(nickName).remove();
            }
            console.log(users)
        });
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg);
                that._displayNewMsg('me', msg);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg);
                that._displayNewMsg('me', msg);
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    that._displayNewMsg('system', 'your browser doesn\'t support fileReader.', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    that.socket.emit('img', e.target.result);
                    that._displayImage('me', e.target.result);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#333';
        if(user === 'me') {
            msgToDisplay.style.textAlign = 'right';
            msgToDisplay.setAttribute('class', 'trans_right');
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span><br/>' + '<p class="msg">'+ msg +'</p>';
        } else if (user === 'system') {
            msgToDisplay.style.textAlign = 'center';
            msgToDisplay.innerHTML = user + ': ' + msg;
        } else {
            msgToDisplay.setAttribute('class', 'trans_left');
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span><br/>' + '<p class="msg">'+ msg +'</p>';
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#333';
        if(user === 'me') {
            msgToDisplay.style.textAlign = 'right';
            msgToDisplay.setAttribute('class', 'trans_right')
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span><br/>' + '<p class="msg"><a href="' + imgData + '" target="_blank"><img style="max-height: 200px;margin-top: 10px;" src="' + imgData + '"/></a></p>';
        } else {
            msgToDisplay.setAttribute('class', 'trans_left')
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span><br/>' + '<p class="msg"><a href="' + imgData + '" target="_blank"><img style="max-height: 200px;margin-top: 10px;" src="' + imgData + '"/></a></p>';
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};
