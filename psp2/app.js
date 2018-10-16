'use strict';                       // im not sure what this does, but i like it

const uid = require('uid-safe');
const chalk = require('chalk');
const _D = require('discord.js');
const _c = new _D.Client();         
var cmds = new Map();               // container for commands
var ps = new Map();                 // container for private channels
var color = 0x00a1ff;               // embed color
var ecolor = 0xff0000;              // error embed color 
var vacid = "501526992370532362";
var memid = "501797339279917077";
var prefix = "//";
var vr, g, vm, vac;                 // prepare some variables for use later


// accept fucntion
var accept = (hu, vu) => {
    var id = uid.sync(8).toLocaleLowerCase();
    var r, voc, txc;
    g.createRole({ name: `private-${id}`, permissions: 36769024, mentionable: false, position: 0 }).then(x => {
        r = x;
        hu.addRole(x);
        vu.addRole(x);
        g.createChannel(`private-${id}`, "voice").then(x => {
            voc = x;
            x.overwritePermissions(g.defaultRole, { 'CREATE_INSTANT_INVITE': false, 'VIEW_CHANNEL': false, 'CONNECT': false, 'SPEAK': false });
            x.overwritePermissions(r, { 'VIEW_CHANNEL': true, 'CONNECT': true, 'SPEAK': true });
            g.createChannel(`private-${id}`, "text").then(x => {
                txc = x;
                x.overwritePermissions(g.defaultRole, { 'CREATE_INSTANT_INVITE': false, 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false, 'READ_MESSAGE_HISTORY': false });
                x.overwritePermissions(r, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true });
                ps[id] = {
                    r: r, voc: voc, txc: txc, v: vu, u: hu, delete: did => {
                        ps[did].r.delete().then(() => {
                            ps[did].voc.delete().then(() => {
                                ps[did].txc.delete();
                            })
                        })
                    }
                };
            });
        });
    });
}

cmds['end'] = {
    f: m => {
        if (!m.channel.name.startsWith('private')) return
        var delpsid = m.channel.name.replace("private-", '');
        var delps = ps[delpsid];
        delps.delete(delpsid);
    }
}
// ping command
cmds['ping'] = {
    f: m => {
        var e = new _D.RichEmbed()  // create new embed
            .setDescription(`Pong! ${_c.ping}ms`)   // set embed text
            .setColor(color);   // set embed color to default color
        m.channel.send(e);      // send the embed
        m.delete();             // delete the command message when we're done with it
    },
    h: "Check lizzy's ping."    // help info
};

cmds['eval'] = {
    f: m => {
        if (m.author.id === '233829889197735937' || m.author.id === '138485053360570370') {
            try {
                var evalstr = eval(m.content.replace(prefix + "eval ", ""));
                var e = new _D.RichEmbed()
                    .setTitle("Result:")
                    .setDescription(evalstr)
                    .setColor(color);
                m.channel.send(e);
            } catch(e) {
                var e = new _D.RichEmbed()
                    .setTitle("Error:")
                    .setDescription(e.stack)
                    .setColor(ecolor);
                m.channel.send(e);
            }
            
        }
    }
}

cmds['helpme'] = {
    f: m => {
        const mu = m.member;
        var e = new _D.RichEmbed()
            .setTitle("I'm pinging the volunteers for you!")
            .setColor(color);
        m.channel.send(e);      
        var e = new _D.RichEmbed()
            .setAuthor(m.member.displayName, m.author.avatarURL)
            .setTitle("This person has requested help.")
            .setDescription(`Type ${prefix}accept ${m.member} to accept.`)
            .setColor(color);
        vac.send("here", e).then(ree => {
            var c = new _D.MessageCollector(ree.channel, x => (x.content.startsWith(prefix + "accept") && x.mentions.members.first() === mu), { time: 300000 })
            c.on('collect', cm => { c.stop('accepted'); })
            c.on('end', (z, r) => {
                if (r === "accepted") { accept(mu, z.first().member); return }
                mu.send(
                    new _D.RichEmbed()
                        .setTitle("Nobody is able to help at the moment. Sorry. Try again.")
                        .setColor(color);
                )
            })
        });
        m.delete();

    }
}

// run when the bot connects to discord's servers
_c.on('ready', () => {
    console.log(`Logged in as ${_c.user.tag}!`); // are we logged in? if so, prove it!
    g = _c.guilds.last();                        // make a variable for the guild we're in. There should only be one, so.. yeah
    vr = g.roles.find(x => x.name === "Volunteer");       // get the role named volunteer from that guild. again, there should only be one
    vm = () => { return vr.members };                     // make a variable for all the member with the volunteer role to make things easier
    console.log("\nVolunteers: ");
    vm().array().forEach(m => { console.log(chalk.hex(m.displayHexColor)(m.displayName)); });    // print out every volunteer's name in their color
    vac = _c.channels.get(vacid);
});

// run whenever we get a message
_c.on('message', m => {
    if (!m.content.startsWith(prefix)) { return }
    if (cmds[m.content.toLocaleLowerCase().split(' ')[0].slice(prefix.length)]) {
        cmds[m.content.toLocaleLowerCase().split(' ')[0].slice(prefix.length)].f(m);  // if something someone said is a command, then run the code attached, and feed it the original message
    }
});

_c.on('guildMemberAdd', mem => {
    mem.addRole(memid);
});

_c.login('');        // do i need to comment this one?