const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const axios = require('axios');
const QuickChart = require('quickchart-js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Ensure this intent is enabled for message content
    ]
});





client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', async (message) => {
    const gameCount = message.content.split(" ")[3];
    const playerName = message.content.split(" ")[1];
    const champion = message.content.split(" ")[2];
    console.log(playerName)
    const encodedPlayerName = encodeURIComponent(playerName);
    const url = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodedPlayerName}`;
    if (message.content.startsWith('!Quanola')) {
        //message.channel.send(playerName);
        try{
            const response = await axios.get(url, {
                headers: {
                    "X-Riot-Token": process.env.RIOT_KEY
                }
            });
            const puuid = response.data.puuid
            const matchHistoryUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${gameCount}`
            //message.channel.send(puuid);
            const matchHistoryResponse= await axios.get(matchHistoryUrl,{
                headers: {
                    "X-Riot-Token": process.env.RIOT_KEY
                }
            })
            const matchHistoryIds = matchHistoryResponse.data;
            let spell1Casts = 0
            let spell2Casts = 0
            let spell3Casts = 0
            let spell4Casts = 0
            let gameTime = 0
            let badGames = 0
            for (const matchId of matchHistoryIds) {
                try {
                    const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
                    const matchResponse = await axios.get(matchUrl, {
                        headers: {
                            "X-Riot-Token": process.env.RIOT_KEY
                        }
                    });
            
                    const matchData = matchResponse.data;
                    const matchingParticipant = matchData.info.participants.find((participant) => participant.puuid === puuid);
                    const matchingParticipantChampion = matchData.info.participants.find((participant) => participant.championName === champion);
                    
                    if (matchingParticipant && matchingParticipantChampion) {
                        spell1Casts = spell1Casts + matchingParticipant.spell1Casts
                        spell2Casts = spell2Casts + matchingParticipant.spell2Casts
                        spell3Casts = spell3Casts + matchingParticipant.spell3Casts
                        spell4Casts = spell4Casts + matchingParticipant.spell4Casts
                        gameTime = gameTime + matchData.info.gameDuration
                        //message.channel.send(`Match ID: ${matchId}, Player Info: ${matchingParticipant.spell4Casts}`);
                    } else {
                        badGames = badGames + 1
                        console.log(`Player with puuid ${targetPuuid} not found in match ID: ${matchId}`);
                    }
                    


                } catch (error) {
                    console.error(error);
                    console.log(`Failed to get data for match ID: ${matchId}`);
                }
                
                
            }
            const averageGameTime = Math.round(gameTime/(gameCount-badGames)/60*100)/100
            const qCast = Math.round(spell1Casts/(gameCount-badGames)*100)/100
            const wCast = Math.round(spell2Casts/(gameCount-badGames)*100)/100
            const eCast = Math.round(spell3Casts/(gameCount-badGames)*100)/100
            const rCast = Math.round(spell4Casts/(gameCount-badGames)*100)/100

            const averageQCast = Math.round(spell1Casts/(gameCount-badGames)/averageGameTime*100)/100
            const averageWCast = Math.round(spell2Casts/(gameCount-badGames)/averageGameTime*100)/100
            const averageECast = Math.round(spell3Casts/(gameCount-badGames)/averageGameTime*100)/100
            const averageRCast = Math.round(spell4Casts/(gameCount-badGames)/averageGameTime*100)/100

            const qPercent = Math.round(qCast/(qCast+wCast+eCast+rCast)*100)
            const wPercent = Math.round(wCast/(qCast+wCast+eCast+rCast)*100)
            const ePercent = Math.round(eCast/(qCast+wCast+eCast+rCast)*100)
            const rPercent = Math.round(rCast/(qCast+wCast+eCast+rCast)*100)
        
            //message.channel.send(`Q: ${spell1Casts/gameCount} W: ${spell2Casts/gameCount} E: ${spell3Casts/gameCount} R: ${spell4Casts/gameCount}`);
            //message.channel.send(`Q/min: ${averageQCast} W/min: ${averageWCast} E/min: ${averageECast} R/min: ${averageRCast}`);
            //message.channel.send(`${averageGameTime} `)

            const chartUrl = generatePieChartUrl(qCast, wCast, eCast, rCast);
            
            message.channel.send(`This is a chart for your average ability cast over ${(gameCount-badGames)} games with an average game duration of ${averageGameTime} min`)
            message.channel.send(`${chartUrl}`);
            message.channel.send(`Q: ${qPercent}% W: ${wPercent}% E: ${ePercent}% R: ${rPercent}%`);
            message.channel.send(`${averageQCast}Q/min | ${averageWCast}W/min | ${averageECast}E/min | ${averageRCast}R/min`);


            

        }catch (error){
            message.channel.send("failed to get player info")
        }
    }   
});


function generatePieChartUrl(qCasts, wCasts, eCasts, rCasts) {
    const chart = new QuickChart();
    chart.setConfig({
        type: 'pie',
        data: {
            labels: ['Q', 'W', 'E', 'R'],
            datasets: [{
                data: [qCasts, wCasts, eCasts, rCasts], // Using raw counts
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Blue for Q
                    'rgba(75, 192, 192, 0.6)', // Green for W
                    'rgba(153, 102, 255, 0.6)', // Purple for E
                    'rgba(255, 205, 86, 0.6)'   // Yellow for R
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 205, 86, 1)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' casts';
                        }
                    }
                }
            }
        }
    });
    chart.setWidth(800).setHeight(400);
    return chart.getUrl();
}


//NOTEs: CHECK GAME MODE, USERNAME SPACES










client.login(process.env.DISCORD_KEY);

