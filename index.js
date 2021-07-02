const { Client, MessageEmbed, Message } = require('discord.js');
const Enmap = require("enmap");

const client = new Client();

const config = require('./config.json');



client.once('ready', () => {

    console.log(`${client.user.username} ready !`)

    // Normal enmap with default options
    client.coins = new Enmap({ name: "coins" });
    client.items = new Enmap({ name: "items" });
    client.staff = ['360783331962650624', '632246754556903477', '397343269345951744', '599722944218005524'];

});

const wonCoinsPerMessage = new Map();
client.on('message', async (message) => {

    if (message.author.bot || !message.guild) return;

    const key = message.author.id;

    let userData = client.coins.get(key);

    if (!userData) {
        userData = client.coins.ensure(key, {
            user: message.author.id,
            joinded_at: Date.now(),
            position: (client.coins.count + 1),
            coins: 0,
            boost_date: Date.now(),
            cooldown_daily: Date.now(),
            cooldown_weekly: Date.now(),
            cooldown_mendier: Date.now(),
            cooldown_casino: Date.now(),
        });
    } else {
        client.coins.update(key, {
            joinded_at: userData.joinded_at ?? Date.now(),
            position: userData.position ?? (client.coins.count),
            coins: userData.coins ?? 0,
            boost_date: Date.now(),
            cooldown_daily: userData.cooldown_daily ?? Date.now(),
            cooldown_weekly: userData.cooldown_weekly ?? Date.now(),
            cooldown_mendier: userData.cooldown_mendier ?? Date.now(),
            cooldown_casino: userData.cooldown_casino ?? Date.now(),
        });
    }

    if (!wonCoinsPerMessage.has(message.author.id)) {
        wonCoinsPerMessage.set(message.author.id);

        let coins = Math.floor(Math.random() * 2) + 5

        const booster = message.member.roles.cache.has("836942086867255298");

        if (booster) coins = parseInt(coins * 1.3);

        client.coins.set(key, userData.coins + coins, "coins");


        client.setTimeout(() => {
            wonCoinsPerMessage.delete(message.author.id);
        }, 20 * 1000);
    }

    const prefix = config.prefix;

    const mentionRegex = new RegExp(`^<@(!|&)?${client.user.id}>`);


    // must start with the bot's prefix, or mentionning the bot
    if (!message.content.startsWith(prefix) && !mentionRegex.test(message.content.trim())) return;

    let content;

    if (message.content.startsWith(prefix)) {
        // get message content without the prefix
        content = message.content.slice(prefix.length).trim();
    } else {
        // get message content without the bot mention
        content = message.content.replace(/^\s*<@(!|&)?\d+>/, '').trim();
    }

    const messageArray = content.split(' ');
    const command = messageArray[0];
    const args = messageArray.splice(1).map((arg) => arg.trim());





    const embed = new MessageEmbed()
        .setColor('YELLOW')

    if (command === 'eval') {
        if (client.staff.includes(message.author.id)) {
            try {

                const evalued = eval(args.join(' '));

                message.channel.send(`\`\`\`js\n${evalued}\n\`\`\``);

            } catch (err) {
                console.log(err);
                message.channel.send(`\`\`\`js\n${err}\n\`\`\``);
            }

        }
        return
    }

    if (command === 'ping') {

        return message.channel.send(`Mon ping est de : **${client.ws.ping}ms**`);

    }

    if (command === 'coins') {

        return message.channel.send(`Coins: **\`${userData?.coins}\`**<a:coins:859440318751440898>`)

    }
    if (command === 'lb') {

        // Get a filtered list (for this guild only), and convert to an array while we're at it.
        const filtered = client.coins.array();

        // Sort it to get the top results... well... at the top. Y'know.
        const sorted = filtered.sort((a, b) => b.coins - a.coins);

        // Slice it, dice it, get the top 10 of it!
        const top10 = sorted.splice(0, 10);

        let desc = '';

        for (const [i, data] of top10.entries()) {
            desc += `**${i + 1}#** <@${data.user}> : **${data.coins}**<a:coins:859440318751440898>\n`
        }


        embed
            .setTitle('Leaderboard top 10')
            .setDescription(desc.slice(0, 2000))

        return message.channel.send(embed);

    }

    if (command === 'stats') {

        let member = await message.guild.members.fetch(message.mentions.users.first()?.id || args[0]).catch(() => null);

        if (!member) {
            return message.channel.send(`Utilisateur non-trouvé !`);
        }

        if (!args[0]) member = message.member;


        userData = client.coins.get(member.user.id);

        if (!userData) {
            return message.channel.send(`${member.user} n'est pas enregistré !`);
        }

        console.log(userData);

        embed
            .setTitle('Statistiques')
            .setDescription(
                `\n\n**Globale**` +
                `\nComptes enregistrés: **\`${client.coins.count}\`**` +
                `\nCoins total: **\`${client.coins.map(d => d.coins).reduce((a, b) => b + a)}\`**<a:coins:859440318751440898>` +

                `\n\n**Vos informations**` +
                `\nInscrit le: **\`SOON\`**` +
                `\nPosition: **\`SOON\`**` +
                `\nCoins: **\`${userData.coins}\`**<a:coins:859440318751440898>` +
                `\nBoost x1.3: ${userData.boost_date > Date.now() ? '`✅ Boost Activé` ' + client.remainingTimeText(userData.boost_date - Date.now()) : '`❌ Aucun  Boost`'}` +

                `\n\n**Vos Cooldown**` +
                `\nDaily: ${userData.cooldown_daily > Date.now() ? client.remainingTimeText(userData.cooldown_daily - Date.now()) : '`✅ Valid`'}` +
                `\nWeekly: ${userData.cooldown_weekly > Date.now() ? client.remainingTimeText(userData.cooldown_weekly - Date.now()) : '`✅ Valid`'}` +
                `\nMendier: ${userData.cooldown_mendier > Date.now() ? client.remainingTimeText(userData.cooldown_mendier - Date.now()) : '`✅ Valid`'}` +
                `\nCasino: ${userData.cooldown_casino > Date.now() ? client.remainingTimeText(userData.cooldown_casino - Date.now()) : '`✅ Valid`'}`
                // `\n` +
            )

        return message.channel.send(embed);

    }

    if (command === 'daily') {

        if (userData.cooldown_daily > Date.now()) {
            return message.channel.send(`Vous devez attendre encore ${client.remainingTimeText(userData.cooldown_daily - Date.now())}`)
        }

        client.coins.set(key, (Date.now() + 86400000), "cooldown_daily");

        const dailyCoins = Math.floor(Math.random() * 500) + 500;

        client.coins.set(key, parseInt(userData.coins + (2 * (userData.boost_date > Date.now() ? dailyCoins * 1.3 : dailyCoins))), "coins");

        return message.channel.send(`Vous venez de gagner **${dailyCoins}**<a:coins:859440318751440898>`)

    }

    if (command === 'weekly') {

        if (userData.cooldown_weekly > Date.now()) {
            return message.channel.send(`Vous devez attendre encore ${client.remainingTimeText(userData.cooldown_weekly - Date.now())}`)
        }

        client.coins.set(key, (Date.now() + 604800000), "cooldown_weekly");

        const weeklyCoins = Math.floor(Math.random() * 1000) + 2000;

        client.coins.set(key, parseInt(userData.coins + (2 * (userData.boost_date > Date.now() ? weeklyCoins : weeklyCoins))), "coins");

        return message.channel.send(`Vous venez de gagner **${weeklyCoins}**<a:coins:859440318751440898>`)

    }

    if (command === 'mendier') {

        if (userData.cooldown_mendier > Date.now()) {
            return message.channel.send(`Vous devez attendre encore ${client.remainingTimeText(userData.cooldown_mendier - Date.now())}`)
        }

        client.coins.set(key, (Date.now() + 50000), "cooldown_mendier");

        const mendierCoins = Math.floor(Math.random() * 50);

        const filteredUsers = client.coins.filter(x => x.coins >= 50 && x.user !== key);

        const mendierUser = filteredUsers.random();

        if (!mendierUser) {
            return message.channel.send('Il n\'y avait personne aujourd\'hui !')
        }

        const u = await message.guild.members.fetch(mendierUser.user);

        const luckToLoose = Math.random();

        if (luckToLoose >= 0.5) {
            return message.channel.send(`\`${u?.user?.tag ?? 'no user'}\` à refuser de vous donner de l'argent !`)
        }

        client.coins.set(mendierUser.user, mendierUser.coins - mendierCoins, "coins");

        client.coins.set(key, userData.coins + (2 * (userData.boost_date > Date.now() ? mendierCoins * 1.3 : mendierCoins)), "coins");

        return message.channel.send(`Vous venez de mendier **${mendierCoins}**<a:coins:859440318751440898> à \`${u?.user?.tag ?? 'no user'}\``)

    }

    if (command === 'give') {

        if (!client.staff.includes(message.author.id)) return;

        const member = await message.guild.members.fetch(message.mentions.users.first()?.id || args[0]).catch(() => null);

        if (!args[0] || !member) {
            return message.channel.send(`Utilisateur non-trouvé !`);
        }

        if (!args[1] || isNaN(parseInt(args[1])) || parseInt(args[1]) <= 0) {
            return message.channel.send(`Montant invalide !`);
        }

        let memberData = client.coins.get(member.user.id);

        if (!memberData) {
            memberData = client.coins.ensure(member.user.id, {
                user: member.user.id,
                joinded_at: Date.now(),
                position: (client.coins.count + 1),
                coins: 0,
                boost_date: Date.now(),
                cooldown_daily: Date.now(),
                cooldown_weekly: Date.now(),
                cooldown_mendier: Date.now(),
                cooldown_casino: Date.now(),
            });
        }


        client.coins.set(member.user.id, memberData.coins + parseInt(args[1]), "coins");

        return message.channel.send(`${member.user} a reçu **\`${args[1]}\`**<a:coins:859440318751440898>`);

    }

    if (command === 'remove') {

        if (!client.staff.includes(message.author.id)) return;

        const member = await message.guild.members.fetch(message.mentions.users.first()?.id || args[0]).catch(() => null);

        if (!args[0] || !member) {
            return message.channel.send(`Utilisateur non-trouvé !`);
        }

        if (!args[1] || isNaN(parseInt(args[1])) || parseInt(args[1]) <= 0) {
            return message.channel.send(`Montant invalide !`);
        }

        let memberData = client.coins.get(member.user.id);

        if (!memberData) {
            memberData = client.coins.ensure(member.user.id, {
                user: member.user.id,
                joinded_at: Date.now(),
                position: (client.coins.count + 1),
                coins: 0,
                boost_date: Date.now(),
                cooldown_daily: Date.now(),
                cooldown_weekly: Date.now(),
                cooldown_mendier: Date.now(),
                cooldown_casino: Date.now(),
            });
        }


        client.coins.set(member.user.id, memberData.coins - parseInt(args[1]), "coins");
        return message.channel.send(`${member.user} a perdu **\`${args[1]}\`**<a:coins:859440318751440898>`);
    }

    if (command === 'reset') {

        if (!client.staff.includes(message.author.id)) return;

        const member = await message.guild.members.fetch(message.mentions.users.first()?.id || args[0]).catch(() => null);

        if (!args[0] || !member) {
            return message.channel.send(`Utilisateur non-trouvé !`);
        }

        let memberData = client.coins.get(member.user.id);

        if (!memberData) {
            return message.channel.send(`${member.user} n'est pas enregistré !`);
        }


        client.coins.set(member.user.id, 0, "coins");
        client.coins.set(member.user.id, Date.now(), "cooldown_daily");
        client.coins.set(member.user.id, Date.now(), "cooldown_weekly");
        client.coins.set(member.user.id, Date.now(), "cooldown_mendier");
        client.coins.set(member.user.id, Date.now(), "cooldown_rob");
        client.coins.set(member.user.id, Date.now(), "cooldown_casino");
        return message.channel.send(`${member.user} a été reset !`);

    }

    if (command === 'casino') {


        if (!args[0] || isNaN(parseInt(args[0])) || parseInt(args[0]) < 1000 || parseInt(args[0]) > 20000) {
            return message.channel.send(`Montant invalide ! de 1000 à 20000`);
        }

        if (userData.cooldown_casino > Date.now()) {
            return message.channel.send(`Vous devez attendre encore ${client.remainingTimeText(userData.cooldown_casino - Date.now())}`)
        }

        client.coins.set(key, (Date.now() + 60000), "cooldown_casino");


        const luckToLoose = Math.random();

        if (luckToLoose >= 0.5) {
            client.coins.set(key, userData.coins - parseInt(args[0]), "coins");
            return message.channel.send(`Vous avez perdu votre mise soit : **${args[0]}**<a:coins:859440318751440898> !`)
        }

        client.coins.set(key, parseInt(userData.coins + (2 * (userData.boost_date > Date.now() ? parseInt(args[0]) * 1.3 : parseInt(args[0])))), "coins");

        return message.channel.send(`Vous venez de gagner **${args[0]}**<a:coins:859440318751440898> !`);


    }

    // if (command === 'rob') {

    // }

    if (command === 'shop') {

        const items = [
            {
                name: 'nitro',
                price: 2000000,
            },
            {
                name: 'grade',
                price: 100000,
            },
            {
                name: 'boost',
                price: 20000,
            }
        ];

        if (!['buy'].includes(args[0])) {

            embed
                .setDescription(
                    `\n**NITRO** ➔ \`2,000,000\`` +
                    `\n**GRADE POP START** ➔ \`100,000\`` +
                    `\n**BOOST x1.3** ➔ \`20,000\``
                )
                .addField('Utilisation:',
                    `\n\`${prefix}shop\`` +
                    `\n\`${prefix}shop buy <${items.map(x => x.name).join(' | ')}>\``
                )

            return message.channel.send(embed);

        } else if (args[0] === 'buy') {

            if (items.map(x => x.name).includes(args[1])) {

                const item = items.find(x => x.name === args[1]);

                if (item) {

                    if (userData.coins < item.price) {
                        return message.channel.send(`Vous n'avez pas assez de coins :/, il vous en faut encore **${item.price - userData.coins}**<a:coins:859440318751440898>`);

                    } else {
                        const channel = message.guild.channels.cache.get('859453027940302868');

                        if (!channel) return;
                        if (item.name === 'nitro') {
                            client.coins.set(key, userData.coins - item.price, "coins");

                            message.member.send(`Vous venez d'acheter un Nitro pour **${item.price}**<a:coins:859440318751440898> !`);
                            channel.send(`${message.member.user} vient d'acheter : ${item.name}`);

                            return message.channel.send(`Contactez un admin`);

                        }
                        else if (item.name === 'grade') {
                            client.coins.set(key, userData.coins - item.price, "coins");
                            message.member.roles.add('852806487016996875');

                            message.member.send(`Vous venez d'acheter un grade pour **${item.price}**<a:coins:859440318751440898>!`);
                            channel.send(`${message.member.user} vient d'acheter : ${item.name}`);

                            return message.channel.send(`Contactez un admin`);

                        }
                        else if (item.name === 'boost') {
                            client.coins.set(key, userData.coins - item.price, "coins");

                            client.coins.set(key, (Date.now() + 86400000), "boost_date");

                            message.member.send(`Confirmation d'achat d'un boost de 24h x1.3 pour **${item.price}**<a:coins:859440318751440898> !`);
                            channel.send(`${message.member.user} vient d'acheter : ${item.name}`)
                            return message.channel.send(`Boost acheté`);

                        }
                    }


                } else {
                    return message.channel.send(`error\n\`${prefix}shop buy <${items.map(x => x.name).join(' | ')}>\``);

                }


            } else {
                return message.channel.send(`Invalide argument`);

            }

        }


    }

    // if (command === '') {

    // }







});

client.remainingTimeText = (remainingTime) => {
    const roundTowardsZero = remainingTime > 0 ? Math.floor : Math.ceil;
    // Gets days, hours, minutes and seconds
    const days = roundTowardsZero(remainingTime / 86400000),
        hours = roundTowardsZero(remainingTime / 3600000) % 24,
        minutes = roundTowardsZero(remainingTime / 60000) % 60,
        seconds = roundTowardsZero(remainingTime / 1000) % 60;
    // Whether values are inferior to zero
    let isDay = days > 0,
        isHour = hours > 0,
        isMinute = minutes > 0;
    const dayUnit = days > 1 ? `**${days}** days` : `**${days}** day`,
        hourUnit = hours > 1 ? `**${hours}** hours` : `**${hours}** hour`,
        minuteUnit = minutes > 1 ? `**${minutes}** minutes` : `**${minutes}** minute`,
        secondUnit = seconds > 1 ? `**${seconds}** seconds` : `**${seconds}** second`;
    // Generates a first pattern
    const content =
        (!isDay ? '' : `${dayUnit}, `) +
        (!isHour ? '' : `${hourUnit}, `) +
        (!isMinute ? '' : `${minuteUnit}, `) +
        ((days + hours + minutes + seconds) === 0 ? 'No time' : `${seconds === 0 ? '' : secondUnit}`);
    return content;
}



client.login(config.token);
