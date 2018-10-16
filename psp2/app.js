'use strict';                       // im not sure what this does, but i like it

const uid = require('uid-safe');
const chalk = require('chalk');
const _D = require('discord.js');
const _c = new _D.Client();         
var commandMap = new Map();               // container for commands
var privateChat = new Map();                 // container for private channels
var color = 0x00a1ff;               // embed color
var errorColor = 0xff0000;              // error embed color 
var volunteerAlertChannelID = "501526992370532362";
var memberRoleID = "501492074856579082";
var prefix = "//";
var volunteerRole, mainGuild, volunteerMembers, volunteerAlertChannel;                 // prepare some variables for use later


// accept fucntion
var accept = (helpUser, volunteerUser) => {
    var id = uid.sync(8).toLocaleLowerCase();
    var privateRole, voiceChannel, privateTextChannel;
    mainGuild.createRole({ name: `private-${id}`, permissions: 36769024, mentionable: false, position: 0 }).then(x => {
        privateRole = x;
        helpUser.addRole(x);
        volunteerUser.addRole(x);
        mainGuild.createChannel(`private-${id}`, "voice").then(x => {
            voiceChannel = x;
            x.overwritePermissions(mainGuild.defaultRole, { 'CREATE_INSTANT_INVITE': false, 'VIEW_CHANNEL': false, 'CONNECT': false, 'SPEAK': false });
            x.overwritePermissions(privateRole, { 'VIEW_CHANNEL': true, 'CONNECT': true, 'SPEAK': true });
            mainGuild.createChannel(`private-${id}`, "text").then(x => {
                privateTextChannel = x;
                x.overwritePermissions(mainGuild.defaultRole, { 'CREATE_INSTANT_INVITE': false, 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false, 'READ_MESSAGE_HISTORY': false });
                x.overwritePermissions(privateRole, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true });
                privateChat[id] = {
                    r: privateRole, voc: voiceChannel, txc: privateTextChannel, v: volunteerUser, u: helpUser, delete: did => {
                        privateChat[did].r.delete().then(() => {
                            privateChat[did].voc.delete().then(() => {
                                privateChat[did].txc.delete();
                            })
                        })
                    }
                };
            });
        });
    });
}

commandMap['end'] = {
    f: m => {
        if (!m.channel.name.startsWith('private')) return
        var deletePrivateChatID = m.channel.name.replace("private-", '');
        var deletePrivateChat = privateChat[deletePrivateChatID];
        deletePrivateChat.delete(deletePrivateChatID);
    }
}
// ping command
commandMap['ping'] = {
    f: m => {
        var e = new _D.RichEmbed()  // create new embed
            .setDescription(`Pong! ${_c.ping}ms`)   // set embed text
            .setColor(color);   // set embed color to default color
        m.channel.send(e);      // send the embed
        m.delete();             // delete the command message when we're done with it
    },
    h: "Check lizzy's ping."    // help info
};

commandMap['eval'] = {
    f: m => {
        if (m.author.id === '233829889197735937' || m.author.id === '138485053360570370') {
            try {
                var evalStr = eval(m.content.replace(prefix + "eval ", ""));
                var e = new _D.RichEmbed()
                    .setTitle("Result:")
                    .setDescription(evalStr)
                    .setColor(color);
                m.channel.send(e);
            } catch(e) {
                var e = new _D.RichEmbed()
                    .setTitle("Error:")
                    .setDescription(e.stack)
                    .setColor(errorColor);
                m.channel.send(e);
            }
            
        }
    }
}

commandMap['helpme'] = {
    f: m => {
        const sender = m.member;
        var e = new _D.RichEmbed()
            .setTitle("I'm pinging the volunteers for you!")
            .setColor(color);
        m.channel.send(e);      
        var e = new _D.RichEmbed()
            .setAuthor(m.member.displayName, m.author.avatarURL)
            .setTitle("This person has requested help.")
            .setDescription(`Type ${prefix}accept ${m.member} to accept.`)
            .setColor(color);
        volunteerAlertChannel.send("here", e).then(ree => {
            var c = new _D.MessageCollector(ree.channel, x => (x.content.startsWith(prefix + "accept") && x.mentions.members.first() === sender), { time: 300000 })
            c.on('collect', cm => { c.stop('accepted'); })
            c.on('end', (z, r) => {
                if (r === "accepted") { accept(sender, z.first().member); return }
                sender.send(
                    new _D.RichEmbed()
                        .setTitle("Nobody is able to help at the moment. Sorry. Try again.")
                        .setColor(color)
                );
            })
        });
        m.delete();

    }
}

// run when the bot connects to discord's servers
_c.on('ready', () => {
    console.log(`Logged in as ${_c.user.tag}!`); // are we logged in? if so, prove it!
    mainGuild = _c.guilds.last();                        // make a variable for the guild we're in. There should only be one, so.. yeah
    volunteerRole = mainGuild.roles.find(x => x.name === "Volunteer");       // get the role named volunteer from that guild. again, there should only be one
    volunteerMembers = () => { return volunteerRole.members };                     // make a variable for all the member with the volunteer role to make things easier
    console.log("\nVolunteers: ");
    volunteerMembers().array().forEach(m => { console.log(chalk.hex(m.displayHexColor)(m.displayName)); });    // print out every volunteer's name in their color
    volunteerAlertChannel = _c.channels.get(volunteerAlertChannelID);
});

// run whenever we get a message
_c.on('message', m => {
    if (!m.content.startsWith(prefix)) { return }
    if (commandMap[m.content.toLocaleLowerCase().split(' ')[0].slice(prefix.length)]) {
        commandMap[m.content.toLocaleLowerCase().split(' ')[0].slice(prefix.length)].f(m);  // if something someone said is a command, then run the code attached, and feed it the original message
    }
});

_c.on('guildMemberAdd', member => {
    member.addRole(memberRoleID);
});

_c.login('');        // do i need to comment this one?