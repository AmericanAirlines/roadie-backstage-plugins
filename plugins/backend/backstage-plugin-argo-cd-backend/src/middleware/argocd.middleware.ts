import { Request, Response, NextFunction } from 'express';
import { getArgoConfigByInstanceName } from '../utils/getArgoConfig';
import { ArgoServiceApi } from '../types/types';

export type RequestWithInstance = Request & {
  instance: { [key: string]: { token: string; url: string, name: string } };
}

export const authenticateOneInstance = (argocdClient: ArgoServiceApi) => {
  return async (
    request: RequestWithInstance,
    response: Response,
    next: NextFunction,
  ) => {
    console.log('authenticateOneInstance');
    try {
      let token: string | undefined;
      const argoInstanceName = request.params.argoInstanceName || request.body.clusterName;

      if (!argoInstanceName) {
        return response.status(400).send({
          status: 'failed',
          message: 'argo instance name is required',
        });
      }

      const matchedArgoInstance = getArgoConfigByInstanceName({
        argoInstanceName,
        argoConfigs: argocdClient.getArgoInstanceArray(),
      });

      if (matchedArgoInstance === undefined) {
        return response.status(404).send({
          status: 'failed',
          message: `argo instance ${argoInstanceName} not found`,
        });
      }

      try {
        token =
          matchedArgoInstance.token ??
          (await argocdClient.getArgoToken(matchedArgoInstance));
        
        if (!token) throw new Error('No argo token found') // May not be needed

        request.instance = {
          [matchedArgoInstance.name]: {
            token,
            url: matchedArgoInstance.url,
            name: matchedArgoInstance.name,
          },
        };
      } catch (e) {
        return response.status(401).send({
          status: 'failed',
          message: `failed to get token for argo instance ${argoInstanceName}: ${e.message}`,
        });
      }
    } catch (e) {
      return response.status(401).send({
        status: 'failed',
        message: `failed trying to authenticate to make an argo request: ${e.message}`,
      });
    }

    next();
  };
};
