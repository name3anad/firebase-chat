var config = {
    apiKey: "AIzaSyAB3EVjKoD9Ce3qCEVAjDncKTzf02eGDHE",
    authDomain: "posts-d0c31.firebaseapp.com",
    databaseURL: "https://posts-d0c31.firebaseio.com",
    storageBucket: "posts-d0c31.appspot.com",
    messagingSenderId: "41618509882"
};
firebase.initializeApp(config);

database = firebase.database();

var currentUser = null;
firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    updateButtonVisibility(currentUser);
});

// login via google
var provider = new firebase.auth.GoogleAuthProvider();
$('#login').on('click', function(e) {
    e.preventDefault();
    if (currentUser === null) {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            updateUserDb(result.user);
        }).catch(function(error) {
            console.log(error.code);
            console.log(error.message);
            console.log(error.email);
            console.log(error.credential);
        });
    }
});

// logout
$('#logout').on('click', function(e) {
    var currentUser = firebase.auth().currentUser;
    if (currentUser !== null) {
        firebase.auth().signOut().then(function() {
            // window.location = '/';
        }, function(error) {
            console.log(error);
        });
    }
});

// utility function to control what section to display basing on the current
// user
function updateButtonVisibility(user) {
    if (user !== null) {
        $('#login-section').addClass('hidden');
        $('#chat').removeClass('hidden');
        $('#logout').removeClass('hidden');
        $('#user-name').text(user.displayName);
        $('#user-avatar').attr('src', user.photoURL);
    }   else {
        $('#login-section').removeClass('hidden');
        $('#chat').addClass('hidden');
        $('#logout').addClass('hidden');
    }
}

// save user information to the database
function updateUserDb(user) {
    var userRef = database.ref('/users/' + user.uid);
    userRef.set({
        name: user.displayName,
        photoUrl: user.photoURL,
        email: user.email
    });
}

// start of code for threads
var messageRef = null;
$('#thread-form').on('submit', function(e) {
    e.preventDefault();
    var name = $('#thread-name').val().trim();
    if (name !== '') {
        if (messageRef !== null) {
            messageRef.off();
        }
        messageRef = database.ref('/message/' + name);
        $('#thread-container').removeClass('hidden');
        fetchThreadMessages()
    }
});

function fetchThreadMessages() {
    if (messageRef !== null) {
        $('#thread').empty();
        messageRef.on('child_added', function(data) {
            displayMessages(data.key, data.val())
        });
    }
}

function displayMessages(messageId, message) {
    var container = $('#thread');
    var messageHtml = '<div class="message"><img src="' + message.sender.photoUrl + '" class="prof-image"><div class="text-container"><p class="username">' + message.sender.name + '</p><p class="content">';
    if ('image_url' in message) {
        messageHtml += '<img src="' + message.image_url + '"><br/>';
    }
    messageHtml += message.message + '</p></div></div>';
    container.append(messageHtml);
    container.scrollTop(container[0].scrollHeight);
}

$('#message-form').on('submit', function(e) {
    e.preventDefault();
    if (messageRef !== null) {
        var messageBox = $('#message');
        var message = messageBox.val().trim();
        var files = $('#image')[0].files;
        if (message !== '' || files.length > 0) {
            messageBox.prop('disabled', true);
            var messageNode = messageRef.push();
            var data = {
                'message': message,
                'when': firebase.database.ServerValue.TIMESTAMP,
                'sender': {
                    'uid': currentUser.uid,
                    'name': currentUser.displayName,
                    'photoUrl': currentUser.photoURL,
                }
            }
            if (files.length > 0) {
                var ref = firebase.storage().ref('/images/' + messageNode.key + '.jpg');
                ref.put(files[0]).then(function(snapshot) {
                    data['image_url'] = snapshot.downloadURL;
                    sendMessage(data, messageNode);
                });
            }   else {
                sendMessage(data, messageNode);
            }
        }
    }
    return 0;
});

function sendMessage(data, messageNode) {
    messageNode.set(data).then(function() {
        var messageBox = $('#message');
        messageBox.prop('disabled', false);
        messageBox.val('');
        $('#image').val('');
    });
}





