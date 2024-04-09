import { Request, Response } from 'express';
import { ArgoServiceApi } from "../types/types";
import { getArgoConfigByInstanceName } from '../utils/getArgoConfig';
import { LoggerService } from '@backstage/backend-plugin-api';



export class ArgocdController {
  constructor(private argocdClient: ArgoServiceApi, private logger: LoggerService) {}

  getOneArgoApp = async (request: Request, response: Response) => {
    const argoInstanceName = request.params.argoInstanceName;
    const matchedArgoInstance = getArgoConfigByInstanceName({
      argoInstanceName,
      argoConfigs: this.argocdClient.getArgoInstanceArray(),
    });

    if (matchedArgoInstance === undefined) {
      return response.status(500).send({
        status: 'failed',
        message: 'cannot find an argo instance to match this cluster',
      });
    }
    const token: string =
      matchedArgoInstance.token ??
      (await this.argocdClient.getArgoToken(matchedArgoInstance));

    if (!token) {
      return response.status(500).send({
        status: 'failed',
        message: 'could not generate token',
      });
    }
    return response.send(
      await this.argocdClient.getArgoAppData(
        matchedArgoInstance.url,
        matchedArgoInstance.name,
        token,
      ),
    );
  };

  doesAppExistWithRepoAndSourcePath = async (request: Request, response: Response) => {
    const argoInstanceName = request.params.argoInstance;
    const matchedArgoInstance = getArgoConfigByInstanceName({
      argoInstanceName,
      argoConfigs: this.argocdClient.getArgoInstanceArray(),
    });
    if (matchedArgoInstance === undefined) {
      return response.status(500).send({
        status: 'failed',
        message: 'cannot find an argo instance to match this cluster',
      });
    }
    const token: string =
      matchedArgoInstance.token ??
      (await this.argocdClient.getArgoToken(matchedArgoInstance));

    if (!token) {
      return response.status(500).send({
        status: 'failed',
        message: 'could not generate token',
      });
    }
    const argoData = await this.argocdClient.getArgoAppData(
      matchedArgoInstance.url,
      matchedArgoInstance.name,
      token,
    );
    const repoAndSource = argoData.items.map(
      (argoApp: any) =>
        `${argoApp?.spec?.source?.repoURL}/${argoApp?.spec?.source?.path}`,
    );
    return response.send(
      repoAndSource.includes(
        `${request.params.repo}/${decodeURIComponent(request.params.source)}`,
      )
    );
  };

  getArgoAppByName = async (request, response) => {
    const argoAppName = request.params.argoAppName;
    const argoAppNamespace = request.query?.appNamespace;
    response.send(
      await this.argocdClient.findArgoApp({
        name: argoAppName as string,
        namespace: argoAppNamespace as string,
      }),
    );
  }

  getRevisionData = async (request, response) => {
    const revisionID: string = request.params.revisionID;
    const argoInstanceName: string = request.params.argoInstanceName;
    const argoAppName = request.params.argoAppName;
    const argoAppNamespace = request.query?.appNamespace;
    this.logger.info(`Getting info on ${argoAppName}`);
    this.logger.info(`Getting app ${argoAppName} on ${argoInstanceName}`);
    // TODO: this repeated section below can be in a middleware ^.^ Yayy! 🥳
    const matchedArgoInstance = getArgoConfigByInstanceName({
      argoInstanceName,
      argoConfigs: this.argocdClient.getArgoInstanceArray(),
    });
    if (matchedArgoInstance === undefined) {
      return response.status(500).send({
        status: 'failed',
        message: 'cannot find an argo instance to match this cluster',
      });
    }
    const token: string =
      matchedArgoInstance.token ??
      (await this.argocdClient.getArgoToken(matchedArgoInstance));

    const resp = await this.argocdClient.getRevisionData(
      matchedArgoInstance.url,
      {
        name: argoAppName,
        namespace: argoAppNamespace as string,
      },
      token,
      revisionID,
    );
    return response.send(resp);
  }

}