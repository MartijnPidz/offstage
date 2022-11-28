import { getConfig } from "./get-config.js";
import { OffstageConfiguratorContext, OffstageState } from "./types";

const allowMock = () => {
  try {
    if((window as any).isOffstagePlaywright) {
      return false;
    }
  } catch(_) {}
  return true;
}

const isImportFromTest = () => {
  try {
    if(process.env.OFFSTAGE_IMPORT_FROM_TEST !== undefined) {
      return true;
    }
  } catch(_) {}
  return false;
}

const isProduction = () => {
  try {
    if(process.env.NODE_ENV === 'production') {
      return true;
    }
  } catch(_) {}
  return false;
}

export default (state:OffstageState) => {
  const handleRestRequest = async(endpoint:string, requestData:any, configureContext:OffstageConfiguratorContext) => {
    const restData = {...requestData};
    const [method,pathPlusQuery] = endpoint.split(' ');
    const [path,query] = pathPlusQuery.split('?');

    let url = path.replace(/:([^\/]+)/, (_:string,match:string) => {
      const value = restData[match];
      delete restData[match]
      return value;
    });

    const params = method === 'GET' ? restData : null;
    if(query) {
      query.split(',').forEach((name:string) => {
        params[name] = requestData[name];
      });
    }

    const config = await getConfig(state, configureContext);
    config.method = method;
    if(method !== 'GET') {
      config.body = JSON.stringify(restData);
    }

    const getParams = params ? '?' + new URLSearchParams(params).toString() : '';
    const finalUrl = `${config.baseURL ?? ''}${url}${getParams}`;

    const result = await fetch(finalUrl, config);
    const resultData = await result.json();
    return resultData;
  }

  const endpoint = <ReqType, ResType>(endpoint:string, mock:(req:ReqType) => ResType) => {
    const func = async(requestData:ReqType):Promise<ResType> => {
      if(allowMock() && !isProduction()) {
        const summary = (obj:any) => JSON.stringify(obj).substring(0,255);
        const responseData = mock(requestData);
        if(!isImportFromTest()) {
          console.debug(`[offstage] mocking ${endpoint}: ${summary(requestData)}`);
          console.debug('[offstage]', responseData);
        }
        return responseData;
      }
      const configureContext:OffstageConfiguratorContext = {
        serviceMethodName: (func as any).serviceMethodName,
      }
      return handleRestRequest(endpoint, requestData, configureContext);
    }
    func.override = (handler:any) => {
      (func as any).overrideHandler = handler;
    }
    return func;
  }
  return endpoint;
}
