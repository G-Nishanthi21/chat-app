import React, { useEffect, useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import "../style/Chat.css";

const Chat = () => {

    let savedReceiverId = sessionStorage.getItem("receiverId");
    let savedReceiverName = sessionStorage.getItem("receiverName");

    if (savedReceiverId === null) {
        savedReceiverId = "";
    }

    if (savedReceiverName === null) {
        savedReceiverName = "";
    }

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [receiverId, setReceiverId] = useState(savedReceiverId);
    const [receiverName, setReceiverName] = useState(savedReceiverName);
    const [receiverOnline, setReceiverOnline] = useState(false);
    const [error, setError] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [lastMessages, setLastMessages] = useState({});
    const [showEmoji, setShowEmoji] = useState(false);

    const messageAreaRef = useRef(null);
    const receiverIdRef = useRef(savedReceiverId);
    const typingTimer = useRef(null);

    const navigate = useNavigate();

    const user = JSON.parse( sessionStorage.getItem("user"));
    const token =  sessionStorage.getItem("token");

    let userId = "";

    if (user !== null) {
        userId = user.userId;
    }

    const getMessageTime = (createdAt) => {

        const date = new Date(createdAt);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    };

    const getDateLabel = (createdAt) => {

        const messageDate = new Date(createdAt);
        const today = new Date();

        if (
            messageDate.getDate() === today.getDate() &&
            messageDate.getMonth() === today.getMonth() &&
            messageDate.getFullYear() === today.getFullYear()
        ) {
            return "Today";
        }

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (
            messageDate.getDate() === yesterday.getDate() &&
            messageDate.getMonth() === yesterday.getMonth() &&
            messageDate.getFullYear() === yesterday.getFullYear()
        ) {
            return "Yesterday";
        }

        return messageDate.toLocaleDateString();

    };

    useEffect(() => {

        if (user === null || token === null) {
            navigate("/login");
            return;
        }

        socket.auth = { token };

        const joinRoom = () => {
            socket.emit("join");
        };

        const connectError = () => {
            setError("Socket authentication failed");
        };

        const receiveMessage = (data) => {

            setLastMessages((previousMessages) => {

                return {
                    ...previousMessages,
                    [data.senderId]: data
                };

            });

            if (data.senderId === receiverIdRef.current) {

                setMessages((previousMessages) => [...previousMessages, data]);

                socket.emit("markMessagesRead", {
                    senderId: data.senderId
                });

            } else {

                setUnreadCounts((previousCounts) => {

                    const updatedCounts = { ...previousCounts };

                    if (updatedCounts[data.senderId] === undefined) {
                        updatedCounts[data.senderId] = 1;
                    } else {
                        updatedCounts[data.senderId] = updatedCounts[data.senderId] + 1;
                    }

                    return updatedCounts;

                });

            }

        };

        const messageSent = (data) => {

            setLastMessages((previousMessages) => {

                return {
                    ...previousMessages,
                    [data.receiverId]: data
                };

            });

            if (data.receiverId === receiverIdRef.current) {
                setMessages((previousMessages) => [...previousMessages, data]);
            }

        };

        const offlineMessages = (data) => {

            data.forEach((item) => {

                setLastMessages((previousMessages) => {

                    return {
                        ...previousMessages,
                        [item.senderId]: item
                    };

                });

                if (item.senderId !== userId && item.read === false) {

                    if (item.senderId === receiverIdRef.current) {

                        socket.emit("markMessagesRead", {
                            senderId: item.senderId
                        });

                    } else {

                        setUnreadCounts((previousCounts) => {

                            const updatedCounts = { ...previousCounts };

                            if (updatedCounts[item.senderId] === undefined) {
                                updatedCounts[item.senderId] = 1;
                            } else {
                                updatedCounts[item.senderId] = updatedCounts[item.senderId] + 1;
                            }

                            return updatedCounts;

                        });

                    }

                }

            });

        };

        const messagesRead = (data) => {

            setMessages((previousMessages) => {

                return previousMessages.map((item) => {

                    if (
                        item.senderId === userId &&
                        item.receiverId === data.senderId
                    ) {

                        return {
                            ...item,
                            read: true,
                            delivered: true
                        };

                    } else {

                        return item;

                    }

                });

            });

        };

        const messageError = (data) => {
            setError(data.message);
        };

        const userStatus = (data) => {

            setUsers((previousUsers) => {

                return previousUsers.map((item) => {

                    if (item._id === data.userId) {

                        return {
                            ...item,
                            isOnline: data.isOnline
                        };

                    } else {

                        return item;

                    }

                });

            });

            if (data.userId === receiverIdRef.current) {
                setReceiverOnline(data.isOnline);
            }

        };

        const userTyping = (data) => {

            setTypingUsers((previousUsers) => {

                return {
                    ...previousUsers,
                    [data.userId]: data.isTyping
                };

            });

        };

        socket.on("connect", joinRoom);
        socket.on("connect_error", connectError);
        socket.on("receiveMessage", receiveMessage);
        socket.on("messageSent", messageSent);
        socket.on("offlineMessages", offlineMessages);
        socket.on("messagesRead", messagesRead);
        socket.on("messageError", messageError);
        socket.on("userStatus", userStatus);
        socket.on("userTyping", userTyping);

        socket.connect();

        return () => {

            socket.off("connect", joinRoom);
            socket.off("connect_error", connectError);
            socket.off("receiveMessage", receiveMessage);
            socket.off("messageSent", messageSent);
            socket.off("offlineMessages", offlineMessages);
            socket.off("messagesRead", messagesRead);
            socket.off("messageError", messageError);
            socket.off("userStatus", userStatus);
            socket.off("userTyping", userTyping);

            clearTimeout(typingTimer.current);

            socket.disconnect();

        };

    }, [user, userId, token, navigate]);

    useEffect(() => {

        if (user !== null && token !== null) {

            fetch("https://chat-app-vvw1.onrender.com/api/user/all", {
                headers: {
                    Authorization: "Bearer " + token
                }
            })
                .then((response) => response.json())
                .then((data) => {

                    setUsers(data.users);

                    if (receiverId !== "") {

                        data.users.forEach((item) => {

                            if (item._id === receiverId) {
                                setReceiverName(item.username);
                                setReceiverOnline(item.isOnline);
                            }

                        });

                    }

                    data.users.forEach((item) => {

                        fetch("https://chat-app-vvw1.onrender.com/api/message/" + item._id, {
                            headers: {
                                Authorization: "Bearer " + token
                            }
                        })
                            .then((response) => response.json())
                            .then((messageData) => {

                                if (
                                    messageData.messages !== undefined &&
                                    messageData.messages.length > 0
                                ) {

                                    let lastMessage =
                                        messageData.messages[messageData.messages.length - 1];

                                    setLastMessages((previousMessages) => {

                                        return {
                                            ...previousMessages,
                                            [item._id]: lastMessage
                                        };

                                    });

                                }

                            })
                            .catch((error) => {
                                console.log(error);
                            });

                    });

                })
                .catch((error) => {
                    console.log(error);
                });

        }

    }, [user, receiverId, token]);

    useEffect(() => {

        if (receiverId !== "" && token !== null) {

            fetch("https://chat-app-vvw1.onrender.com/api/message/" + receiverId, {
                headers: {
                    Authorization: "Bearer " + token
                }
            })
                .then((response) => response.json())
                .then((data) => {

                    if (data.messages !== undefined) {

                        setMessages(data.messages);

                        if (data.messages.length > 0) {

                            let lastMessage =
                                data.messages[data.messages.length - 1];

                            setLastMessages((previousMessages) => {

                                return {
                                    ...previousMessages,
                                    [receiverId]: lastMessage
                                };

                            });

                        }

                        socket.emit("markMessagesRead", {
                            senderId: receiverId
                        });

                    }

                })
                .catch((error) => {
                    console.log(error);
                });

        }

    }, [receiverId, token]);
    useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handleBack = () => {
        window.history.pushState(null, "", window.location.pathname);
    };

    window.addEventListener("popstate", handleBack);

    return () => {
        window.removeEventListener("popstate", handleBack);
    };
}, []);

    useEffect(() => {

        if (messageAreaRef.current !== null) {

            messageAreaRef.current.scrollTop =
                messageAreaRef.current.scrollHeight;

        }

    }, [messages]);

    const selectUser = async (id, name, online) => {

        clearTimeout(typingTimer.current);

        if (receiverIdRef.current !== "") {

            socket.emit("stopTyping", {
                receiverId: receiverIdRef.current
            });

        }

        receiverIdRef.current = id;

        setReceiverId(id);
        setReceiverName(name);
        setReceiverOnline(online);
        setMessages([]);
        setError("");
        setShowEmoji(false);

        sessionStorage.setItem("receiverId", id);
         sessionStorage.setItem("receiverName", name);

        try {

            const response = await fetch(
                "https://chat-app-vvw1.onrender.com/api/message/" + id,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (response.status === 200) {

                setMessages(data.messages);

                if (data.messages.length > 0) {

                    let lastMessage =
                        data.messages[data.messages.length - 1];

                    setLastMessages((previousMessages) => {

                        return {
                            ...previousMessages,
                            [id]: lastMessage
                        };

                    });

                }

                setUnreadCounts((previousCounts) => {

                    const updatedCounts = { ...previousCounts };
                    updatedCounts[id] = 0;

                    return updatedCounts;

                });

                socket.emit("markMessagesRead", {
                    senderId: id
                });

            } else {

                setError("Failed to load messages");

            }

        } catch (error) {

            setError("Something went wrong");

        }

    };

    const sendMessage = (e) => {

        e.preventDefault();

        if (message.trim() === "") {
            return;
        }

        if (receiverId === "") {
            setError("Please select a user");
            return;
        }

        clearTimeout(typingTimer.current);

        socket.emit("stopTyping", {
            receiverId: receiverId
        });

        socket.emit("sendMessage", {
            receiverId: receiverId,
            message: message.trim()
        });

        setMessage("");
        setError("");
        setShowEmoji(false);

    };

    const addEmoji = (emojiData) => {

        setMessage(message + emojiData.emoji);

    };

    const logout = () => {

        clearTimeout(typingTimer.current);

        socket.disconnect();

         sessionStorage.removeItem("user");
         sessionStorage.removeItem("token");
         sessionStorage.removeItem("receiverId");
         sessionStorage.removeItem("receiverName");

        navigate("/login");

    };

    let chatContent = null;

    if (receiverId === "") {

        chatContent = (
            <div className="empty-chat">
                <h2>Welcome to ChatApp</h2>



            
            </div>
        );

    } else {

        let previousDate = "";

        chatContent = (
            <>

                <div className="chat-header">

                    <div className="user-avatar">
                        {receiverName.charAt(0).toUpperCase()}
                    </div>

                    <div>

                        <h3>{receiverName}</h3>

                        {typingUsers[receiverId] === true && (
                            <p className="typing-status">Typing...</p>
                        )}

                        {typingUsers[receiverId] !== true && receiverOnline === true && (
                            <p className="online-status">Online</p>
                        )}

                        {typingUsers[receiverId] !== true && receiverOnline === false && (
                            <p className="offline-status">Offline</p>
                        )}

                    </div>

                </div>

                <div className="message-area" ref={messageAreaRef}>

                    {messages.map((item) => {

                        let messageClass = "message-row received-message";
                        let tickClass = "grey-tick";
                        let tickText = "✓";

                        if (item.senderId === userId) {
                            messageClass = "message-row sent-message";
                        }

                        if (item.read === true) {
                            tickClass = "blue-tick";
                        }

                        if (item.delivered === true) {
                            tickText = "✓✓";
                        }

                        let messageDate = new Date(item.createdAt);

                        let dateKey =
                            messageDate.getDate() + "-" +
                            messageDate.getMonth() + "-" +
                            messageDate.getFullYear();

                        let showDate = false;

                        if (dateKey !== previousDate) {
                            showDate = true;
                            previousDate = dateKey;
                        }

                        return (

                            <React.Fragment key={item._id}>

                                {showDate === true && (
                                    <div className="date-separator">
                                        <span>{getDateLabel(item.createdAt)}</span>
                                    </div>
                                )}

                                <div className={messageClass}>

                                    <div className="message-bubble">

                                        <p>{item.message}</p>

                                        <div className="message-bottom">

                                            <span className="message-time">
                                                {getMessageTime(item.createdAt)}
                                            </span>

                                            {item.senderId === userId && (

                                                <span className={tickClass}>
                                                    {tickText}
                                                </span>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            </React.Fragment>

                        );

                    })}

                </div>

                {error !== "" && (
                    <p className="chat-error">{error}</p>
                )}

                <form className="message-input" onSubmit={sendMessage}>

                    <button
                        type="button"
                        className="emoji-button"
                        onClick={() => {

                            if (showEmoji === true) {
                                setShowEmoji(false);
                            } else {
                                setShowEmoji(true);
                            }

                        }}
                    >
                        😊
                    </button>

                    {showEmoji === true && (

                        <div className="emoji-picker">
                            <EmojiPicker onEmojiClick={addEmoji} />
                        </div>

                    )}

                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => {

                            setMessage(e.target.value);

                            clearTimeout(typingTimer.current);

                            if (e.target.value.trim() !== "" && receiverId !== "") {

                                socket.emit("typing", {
                                    receiverId: receiverId
                                });

                                typingTimer.current = setTimeout(() => {

                                    socket.emit("stopTyping", {
                                        receiverId: receiverId
                                    });

                                }, 1500);

                            } else {

                                socket.emit("stopTyping", {
                                    receiverId: receiverId
                                });

                            }

                        }}
                    />

                    <button type="submit">Send</button>

                </form>

            </>
        );

    }

    return (

        <div className="chat-page">

            <div className="chat-sidebar">

                <div className="sidebar-header">
                    <button onClick={logout}>Logout</button>
                </div>

                <div className="user-heading">
                    <h3>Messages</h3>
                </div>

                <div className="user-list">

                    {users.map((item) => {

                        let userClass = "user-item";

                        if (receiverId === item._id) {
                            userClass = "user-item active";
                        }

                        let previewMessage = "";
                        let previewTime = "";

                        if (lastMessages[item._id] !== undefined) {

                            if (lastMessages[item._id].isDeleted === true) {
                                previewMessage = "This message was deleted";
                            } else {
                                previewMessage = lastMessages[item._id].message;
                            }

                            previewTime = getMessageTime(lastMessages[item._id].createdAt);

                        }

                        return (

                            <div
                                className={userClass}
                                key={item._id}
                                onClick={() => selectUser(
                                    item._id,
                                    item.username,
                                    item.isOnline
                                )}
                            >

                                <div className="user-avatar">
                                    {item.username.charAt(0).toUpperCase()}
                                </div>

                                <div className="user-info">

                                    <div className="user-name-row">

                                        <span>{item.username}</span>

                                        {unreadCounts[item._id] > 0 && (
                                            <span className="unread-count">
                                                {unreadCounts[item._id]}
                                            </span>
                                        )}

                                        {previewTime !== "" && (
                                            <span className="preview-time">
                                                {previewTime}
                                            </span>
                                        )}

                                    </div>

                                    <p className="last-message-preview">
                                        {previewMessage}
                                    </p>

                                </div>

                            </div>

                        );

                    })}

                </div>

                <div className="profile-section">

                    <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <p>You</p>
                        <span>{user.username}</span>
                    </div>

                </div>

            </div>

            <div className="chat-main">
                {chatContent}
            </div>

        </div>

    );

};

export default Chat;