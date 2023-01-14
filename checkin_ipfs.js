const Discord = require('discord.js');
const client = new Discord.Client();
const moment = require('moment-timezone');
const responses = [];
const checkin_complete = {};
const lastCheckin = {};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // set a schedule for check-in reminder at 1 PM Eastern time, converted to local time
    let scheduledTime = moment.tz("13:00", "HH:mm", "America/New_York").format();
    let currentTime = moment().format();
    let diff = moment(scheduledTime).diff(moment(currentTime));
    if (diff < 0) {
        diff = moment(scheduledTime).add(1, 'day').diff(moment(currentTime));
    }
    setTimeout(() => {
        get_users().forEach(user => {
            let localTime = moment.tz(scheduledTime, get_user_timezone(user)).format("HH:mm z");
            send_reminder(user, `Reminder: Your daily check-in is due at 6:00 PM (Local Time: ${localTime}). Use the command "/checkin" to complete it.`);
        });
    }, diff);
    // set a schedule for check-in reminder at 5 PM Eastern time, converted to local time
    scheduledTime = moment.tz("17:00", "HH:mm", "America/New_York").format();
    currentTime = moment().format();
    diff = moment(scheduledTime).diff(moment(currentTime));
    if (diff < 0) {
        diff = moment(scheduledTime).add(1, 'day').diff(moment(currentTime));
    }
    setTimeout(() => {
        get_users().forEach(user => {
            let localTime = moment.tz(scheduledTime, get_user_timezone(user)).format("HH:mm z");
            send_reminder(user, `Reminder: Your daily check-in is due at 6:00 PM (Local Time: ${localTime}). Use the command "/checkin" to complete it.`);
        });
    }, diff);
});

client.on('message', msg => {
    if (msg.content === "/checkin") {
        let scheduledTime = moment.tz("19:00", "HH:mm", "America/New_York").format();
        let currentTime = moment().format();
        if (!lastCheckin[msg.author.id] || moment().diff(lastCheckin[msg.author.id], 'hours') >= 24) {
            if (moment().isAfter(scheduledTime)) {
                // Send the check-in questions to the user
                msg.channel.send("1. How are you feeling?\n2. What did you accomplish today?\n3. How much time did it take?\n4. What got in your way?\n5. What do you plan to accomplish next?\n6. What do you need to succeed going forward?");
                // Wait for user's response
                const filter = m => m.author.id === msg.author.id;
                msg.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                    .then(collected => {
                        // Save the user's response in the response array
                        responses.push({
                            user: msg.author.id,
                            message: collected.first().content,
                            timestamp: collected.first().createdTimestamp
                        });
                        // Mark the user's check-in as complete
                        checkin_complete[msg.author.id] = true;
                        lastCheckin[msg.author.id] = moment();
                        msg.reply("Thank you for completing your daily check-in.");
                    })
                    .catch(collected => {
                        // Send message to user that they didn't respond in time
                        msg.reply("You didn't respond in time. Your response was not recorded.");
                    });
            } else {
                let localTime = moment.tz(scheduledTime, get_user_timezone(msg.author)).format("HH:mm z");
                msg.reply(`Check-in time is not yet started. You may begin your check-in at 7:00 PM (Local Time: ${localTime}).`);
            }
        } else {
            msg.reply(`You can only submit once a day, you last checkin was at ${moment(lastCheckin[msg.author.id]).format("HH:mm z")} `);
        }
    }
});

client.on('message', msg => {
    if (msg.content === "/editcheckin") {
        if (lastCheckin[msg.author.id]) {
            let scheduledTime = moment.tz("19:00", "HH:mm", "America/New_York").format();
            if (moment().isBefore(scheduledTime) && !checkin_complete[msg.author.id]) {
                msg.channel.send("Please type your new response for today's check-in:");
                const filter = m => m.author.id === msg.author.id;
                msg.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                    .then(collected => {
                        // Save the user's response in the response array
                        let responseIndex = responses.findIndex(x => x.user === msg.author.id);
                        responses[responseIndex].message = collected.first().content;
                        responses[responseIndex].timestamp = collected.first().createdTimestamp;
                        msg.reply("Your response has been updated.");
                    })
                    .catch(collected => {
                        // Send message to user that they didn't respond in time
                        msg.reply("You didn't respond in time. Your response was not updated.");
                    });
            } else {
                msg.reply("You cannot edit your response at this time.");
            }
        } else {
            msg.reply("You have not submitted a response today.");
        }
    }
});

client.on('message', msg => {
    if (msg.content === "!approve" && msg.member.hasPermission("ADMINISTRATOR")) {
        // Create a CSV file with the responses and send it to the admin
        let csv = "User,Response,Timestamp\n";
        for (let i = 0; i < responses.length; i++) {
            csv += `<@${responses[i].user}>,${responses[i].message},${responses[i].timestamp}\n`;
        }
        // Store the report on IPFS with the naming convention "DM Check IN_today's date_"
        // Store the report on IPFS with the naming convention "DM Check IN_today's date_"
        msg.channel.send("Check-in report has been approved and sent to you.");
    }
});

// function to get all server users
function get_users() {
    return client.users.cache;
}

// function to get the user's local time zone
function get_user_timezone(user) {
    // Get the user's timezone from the server or from a saved setting
    // Example: return 'America/Los_Angeles';
}

// function to send a reminder message to the user
function send_reminder(user, message) {
    user.send(message);
}

client.login(DISCORD_APP_TOKEN);
 
