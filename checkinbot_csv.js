/*
This script includes functionality for users to begin their daily check-in by typing "/checkin" and to edit their response by typing "/editcheckin". It also includes reminder messages sent to users at 1:00 PM and 5:00 PM Eastern Time, and a report generated and saved as a CSV file with the naming convention "DM_Checkins_{todays date}.csv". The report is reset at 6:59 PM Eastern Time. The report generation does not require IPFS storage and it will be saved on the server.
*/

/*
Application ID: 1063828922925584455
Public Key: dae5963cf5f0d894e416879836ecbf83a805c7946b5fdc00345bfc0e70eb2488
G

*/

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const token = process.env.TOKEN;

client.login(1063828922925584455);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Schedule the first reminder message to be sent at 1:00 PM Eastern Time
    schedule.scheduleJob('0 13 * * *', function () {
        let users = get_users();
        for (let i = 0; i < users.length; i++) {
            let userTimezone = get_user_timezone(users[i]);
            let currentTime = moment().tz(userTimezone);
            if (currentTime.isBefore(moment.tz(`17:00`, `HH:mm`, userTimezone)) && !checkin_complete[users[i].id]) {
                let scheduledTime = moment.tz(`19:00`, `HH:mm`, userTimezone).format();
                let reminderMessage = `Reminder: Please complete your daily check-in before ${scheduledTime} (local time).`;
                users[i].send(reminderMessage);
            }
        }
    });

    // Schedule the second reminder message to be sent at 5:00 PM Eastern Time
    schedule.scheduleJob('0 17 * * *', function () {
        let users = get_users();
        for (let i = 0; i < users.length; i++) {
            let userTimezone = get_user_timezone(users[i]);
            let currentTime = moment().tz(userTimezone);
            if (currentTime.isBefore(moment.tz(`19:00`, `HH:mm`, userTimezone)) && !checkin_complete[users[i].id]) {
                let scheduledTime = moment.tz(`19:00`, `HH:mm`, userTimezone).format();
                let reminderMessage = `Reminder: Your daily check-in is due before ${scheduledTime} (local time).`;
                users[i].send(reminderMessage);
            }
        }
    });

    // Schedule the report to be reset at 6:59 PM Eastern Time
    schedule.scheduleJob('59 18 * * *', function () {
        // reset the responses array
        responses = [];
        // reset the checkin_complete object
        checkin_complete = {};
          // reset the lastCheckin object
          lastCheckin = {};
        });
    });
    
    let responses = [];
    let checkin_complete = {};
    let lastCheckin = {};
    
    client.on('message', msg => {
        if (msg.content === '/checkin' && msg.channel.id === '1063461806267432980') {
            let scheduledTime = moment.tz(`19:00`, `HH:mm`, `America/New_York`).format();
            let currentTime = moment().tz(get_user_timezone(msg.author));
            if (!lastCheckin[msg.author.id] || moment(lastCheckin[msg.author.id]).isBefore(moment().subtract(1, 'd'))) {
                msg.channel.send(`${msg.author}, please answer the following questions before ${scheduledTime} (local time):
    1. How are you feeling?
    2. What did you accomplish today?
    3. How much time did it take?
    4. What got in your way?
    5. What are you planning to accomplish next?
    6. What do you need to succeed going forward?`);
                lastCheckin[msg.author.id] = moment();
            } else {
                msg.channel.send(`Sorry, ${msg.author}, you have already completed your check-in for today.`);
            }
        } else if (msg.content.startsWith(`/editcheckin`) && msg.channel.id === '1063461806267432980') {
            let currentTime = moment().tz(get_user_timezone(msg.author));
            let scheduledTime = moment.tz(`19:00`, `HH:mm`, `America/New_York`).format();
            if (currentTime.isBefore(scheduledTime)) {
                let responseIndex = responses.findIndex(response => response.author === msg.author.id);
                if (responseIndex >= 0) {
                    responses[responseIndex].answers = msg.content.slice(12);
                    msg.channel.send(`${msg.author}, your check-in has been updated.`);
                } else {
                    msg.channel.send(`Sorry, ${msg.author}, you have not completed a check-in yet today.`);
                }
            } else {
                msg.channel.send(`Sorry, ${msg.author}, you cannot edit your check-in at this time.`);
            }
        } else if (msg.content === '/report' && msg.channel.id === '1063461806267432980') {
            if (responses.length > 0) {
                let today = moment().format(`MM-DD-YYYY`);
                let csv = `user,answers\n`;
                for (let i = 0; i < responses.length; i++) {
                    let user = client.users.cache.get(responses csv += `${responses[i].author},${responses[i].answers}\n`;
                }
                fs.writeFile(`DM_Checkins_${today}.csv`, csv, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        msg.channel.send(`Check-in report for ${today} has been generated and is ready for download.`);
                    }
                });
            } else {
                let response = {
                    author: msg.author.id,
                    answers: msg.content
                };
                responses.push(response);
                checkin_complete[msg.author.id] = true;
            }
        }
        });
        
        // Helper function to get the timezone of a user
        function get_user_timezone(user) {
            // replace this with a call to your own timezone database
            return 'America/New_York';
        }
        
        // Helper function to send a reminder message to a user
        function send_reminder(user, message) {
            user.send(message);
        }
        
        // Helper function to get all the users in the server
        function get_users() {
            return client.users.cache.array();
        }
        
    
