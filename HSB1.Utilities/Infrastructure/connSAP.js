import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const auth = {
    UserName: process.env.SAP_USER,
    Password: process.env.SAP_PWD,
    CompanyDB:process.env.SAP_DB
  };
  
const apiClient = axios.create({
  withCredentials: true,
  baseURL: process.env.SAP_URL,
  responseType: 'json',
  headers:{'Content-Type': 'application/json'},
  httpsAgent: new https.Agent({  rejectUnauthorized: false})
});
  
async function  login(sess) {
  const retorno =  await apiClient.post('/Login', auth);
  console.log('Login ' + retorno.headers['set-cookie'][0].split(';')[0] + '; ' + retorno.headers['set-cookie'][1].split(';')[0]);
  sess.sessionToken = retorno.headers['set-cookie'][0].split(';')[0] + '; ' + retorno.headers['set-cookie'][1].split(';')[0];
  const now = new Date(); // Obtém a hora atual
  const future = new Date(now.getTime() + retorno.data.SessionTimeout * 60000); // Setar o horario de TimeOut
  sess.sessionTimeout = future;
  return retorno;
};  

async function validaSession(sess){
  const currentTime = Date.now();
  
  if(sess.sessionToken && sess.sessionTimeout && sess.sessionTimeout > currentTime) {
    console.log('Nao Chama login');
    
  }else {
    //console.log('Chama login');
    const ret = await login(sess);
  };
}

async function execSAP(verb, endpoint, content, session) {

  await validaSession(session);

  console.log(verb + " " + process.env.SAP_URL + endpoint);

  let config = {
      method: verb,
      maxBodyLength: Infinity,
      url: process.env.SAP_URL + endpoint,
      headers: { 
        'Content-Type': 'text/plain', 
        'Cookie':session.sessionToken
        //'Cookie': ret.headers['set-cookie'][0].split(';')[0] + '; ' + ret.headers['set-cookie'][1].split(';')[0]
      },
      httpsAgent: new https.Agent({  rejectUnauthorized: false}),
      data : content
    };

  try {
      let resSAP = {};

      await axios.request(config).then((res) => {resSAP = {"status":res.status,"message":"", "data": res.data}})
                                  .catch((e) => {
                                    if (e.response) {
                                      resSAP = {"status":e.response.data.error.code,"message":e.response.data.error.message.value, "data":""}
                                    } else {
                                      resSAP = {"status":500,"message":e.message, "data":""}
                                    }});
      return resSAP;
      
    } catch(er){
        console.log(er);
  };
};

export default execSAP;