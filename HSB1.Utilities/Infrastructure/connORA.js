import  oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

try {
  //oracledb.initOracleClient({libDir: 'E:\\app\\rodrigo.grijo\\product\\11.2.0\\client_1'});
  oracledb.initOracleClient();
} catch (err) {
    if (err.message.indexOf('been initialized') === 0) {
      console.error('Whoops!');
      console.error(err);
      process.exit(1);
    }
  }

  async function ExecORA(sql){
    try{
      const config = {user: process.env.ORCL_USER,
                      password: process.env.ORCL_PWD,
                      connectString: process.env.ORCL_CS};

      const options = {outFormat: oracledb.OUT_FORMAT_OBJECT,
                        stringify: (obj) => JSON.stringify(obj)
      };                          

      const connection = await oracledb.getConnection(config);
      let result = null;
      //console.log(sql);

      if (!Array.isArray(sql)) {
        try{
          result = await connection.execute(sql,[],options);
        }catch(err){
          connection.commit();
          connection.close();
          
          console.log("Erro ao Executar Instrução:" + err.message);
          console.log(sql);
          console.error(err.message);
          return null;
        };
      } else {
        var listaSQLs = [];
        var resultado = [];

        for (const s of sql) {
          const response = connection.execute(s,[],options);
          listaSQLs.push(response);
        }
        
        try{
            var retornoListaSQLs = await Promise.all(listaSQLs);
            retornoListaSQLs.forEach(r => {
              resultado.push(r.rows)
            });

          }catch(err){
            connection.commit();
            connection.close();
            
            console.log("Erro ao Executar Instrução:" + err.message);
            console.error(err.message);
            return null;
          };


          connection.commit();
          connection.close();
  
          return resultado;
        };

      //result = await connection.execute(sql,[],options);
      //console.log(result);

      connection.commit();
      connection.close();

      if (result.rowsAffected == null) {
        return result.rows;
      }
      else {
        return result.rowsAffected;
      }
    } catch(err)
    {
      console.log("Conexao Error" + err.message);
      console.error(err.message);
      return null;
    }

}

export default ExecORA;
    
