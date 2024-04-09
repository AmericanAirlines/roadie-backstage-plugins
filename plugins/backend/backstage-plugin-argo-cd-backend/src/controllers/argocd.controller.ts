import { Request, Response } from 'express';
import { ArgoServiceApi } from "../types/types";
import { getArgoConfigByInstanceName } from '../utils/getArgoConfig';



export class ArgocdController {
  constructor(private argocdclient: ArgoServiceApi) {}

    getOneArgoApp = async (request: Request, response: Response) => {
        const argoInstanceName = request.params.argoInstanceName;
        const matchedArgoInstance = getArgoConfigByInstanceName({
          argoInstanceName,
          argoConfigs: this.argocdclient.getArgoInstanceArray(),
        });
    
        if (matchedArgoInstance === undefined) {
          return response.status(500).send({
            status: 'failed',
            message: 'cannot find an argo instance to match this cluster',
          });
        }
        const token: string =
          matchedArgoInstance.token ??
          (await this.argocdclient.getArgoToken(matchedArgoInstance));
    
        if (!token) {
          return response.status(500).send({
            status: 'failed',
            message: 'could not generate token',
          });
        }
        return response.send(
          await this.argocdclient.getArgoAppData(
            matchedArgoInstance.url,
            matchedArgoInstance.name,
            token,
          ),
        );
      }
}