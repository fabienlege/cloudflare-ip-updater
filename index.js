require('dotenv').config();
const axios = require('axios');
const args = require('yargs/yargs')(process.argv.slice(2))
  .alias('d', 'ndd')
  .describe('d', 'name of the domain name to update')
  .alias('z', 'zone')
  .describe('z', "ID of the cloudflare zone to update")
  .alias('r', 'record')
  .describe('r', 'ID of the Cloudflare DNS Record to update')
  .argv

const App = async () => {
  /**
   * STEP 0 ===
   * 
   * Verify command line arguments and env variables
   */
  ['ndd', 'zone', 'record'].forEach((argsKey) => {
    if(!args[argsKey]){
      throw new Error(`L'argument '${argsKey}' doit être spécifié lors de l'exécution de la ligne de commande. voir 'node index.js --help' pour plus d'informations`);
    }

  });
  if(!process.argv[2]){
    throw new Error("Un nom de domaine (ou sous-domaine) doit être spécifié lors de l'exécution de la commande. Vous pouvez par exemple exécuter `node index.js monndd.fr`");
  }
  ['CLOUDFLARE_AUTH_EMAIL', 'CLOUDFLARE_AUTH_KEY', 'CLOUDFLARE_API_ROOT'].forEach((envKey) => {
    if(!process.env[envKey]){
      throw new Error(`la variable d'environement ${envKey} doit être définie.`);
    }
  });

  /**
   * STEP 1 ===
   * 
   * Retrieve my current IP
   */
  try{
    var IpApiResponse = await axios.get('https://api.ipify.org?format=json');

    if(!IpApiResponse?.data?.ip){
      throw new Error("Impossible de récupérer l'adresse IP courrante");
    }
  }
  catch(e){
    throw e;
  }
  
  /**
   * STEP 2 ===
   * 
   * Update cloudflare record via API
   */
  try{
    const cloudflareResponse = await axios.put(
      `${process.env.CLOUDFLARE_API_ROOT}/zones/${args.zone}/dns_records/${args.record}`,
      {type: 'A', name: args.ndd, content: IpApiResponse.data.ip, ttl:3600, proxied: false},
      {headers: {'X-Auth-Email':process.env.CLOUDFLARE_AUTH_EMAIL,'X-Auth-Key': process.env.CLOUDFLARE_AUTH_KEY}}
    );

    if(!cloudflareResponse?.data?.success){
      throw new Error(`Une erreur est survenue lors de l'appel à l'API cloudflare (${cloudflareResponse.status} : ${cloudflareResponse.statusText})`);
    }
  }
  catch(e){
    throw e;
  }

  console.log(`${(new Date).toLocaleString()} : Cloudflare successfully updated`)
}

// Run app
App(); //first run on startup
setInterval(App, 1000*60); //run every hour