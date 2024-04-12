import { Request, Response } from 'express';
import { ArgoServiceApi } from '../types/types';
import { getArgoConfigByInstanceName } from '../utils/getArgoConfig';
import { LoggerService } from '@backstage/backend-plugin-api';
import { RequestWithInstance } from '../middleware/argocd.middleware';

export class ArgocdController {
  constructor(
    private argocdClient: ArgoServiceApi,
    private logger: LoggerService,
  ) {}

  getAllArgoApps = async (request: RequestWithInstance, response: Response) => {
    return response.send(
      await this.argocdClient.getArgoAppData(
        request.instance[request.params.argoInstanceName].url,
        request.instance[request.params.argoInstanceName].name,
        request.instance[request.params.argoInstanceName].token,
      ),
    );
  };

  doesAppExistWithRepoAndSourcePath = async (
    request: RequestWithInstance,
    response: Response,
  ) => {
    const argoData = await this.argocdClient.getArgoAppData(
        request.instance[request.params.argoInstanceName].url,
        request.instance[request.params.argoInstanceName].name,
        request.instance[request.params.argoInstanceName].token,
    );
    const repoAndSource = argoData.items.map(
      (argoApp: any) =>
        `${argoApp?.spec?.source?.repoURL}/${argoApp?.spec?.source?.path}`,
    );
    return response.send(
      repoAndSource.includes(
        `${request.params.repo}/${decodeURIComponent(request.params.source)}`,
      ),
    );
  };

  findAllArgoAppsByName = async (request, response) => {
    // TODO: NEED TO FIGURE THIS OUT! - Multiple Instances
    const argoAppName = request.params.argoAppName;
    const argoAppNamespace = request.query?.appNamespace;
    response.send(
      await this.argocdClient.findArgoApp({
        name: argoAppName as string,
        namespace: argoAppNamespace as string,
      }),
    );
  };

  getAppRevisionData = async (request, response) => {
    const revisionID: string = request.params.revisionID;
    const argoAppName = request.params.argoAppName;
    const argoAppNamespace = request.query?.appNamespace;
    this.logger.info(`Getting info on ${argoAppName}`);
    this.logger.info(`Getting app ${argoAppName} on ${request.params.argoInstanceName}`);
    const resp = await this.argocdClient.getRevisionData(
        request.instance[request.params.argoInstanceName].url,
      {
        name: argoAppName,
        namespace: argoAppNamespace as string,
      },
      request.instance[request.params.argoInstanceName].token,
      revisionID,
    );
    return response.send(resp);
  };

  getOneArgoApplicationInformationV1 = async (request, response) => {
    const argoAppName = request.params.argoAppName;
    const argoAppNamespace = request.query?.appNamespace;
    this.logger.info(`Getting info on ${argoAppName}`);
    this.logger.info(`Getting app ${argoAppName} on ${request.params.argoInstanceName}`);

    const resp = await this.argocdClient.getArgoAppData(
        request.instance[request.params.argoInstanceName].url,
        request.instance[request.params.argoInstanceName].name,
        request.instance[request.params.argoInstanceName].token,
      { name: argoAppName, namespace: argoAppNamespace as string },
    );
    return response.send(resp);
  };

  findAllArgoAppsBySelector = async (request, response) => {
    // TODO: NEED TO FIGURE THIS OUT! - Multiple Instances
    const argoAppSelector = request.params.argoAppSelector;
    const argoAppNamespace = request.query?.appNamespace;
    this.logger.info(`Getting apps for selector ${argoAppSelector}`);
    response.send(
      await this.argocdClient.findArgoApp({
        selector: argoAppSelector,
        namespace: argoAppNamespace as string,
      }),
    );
  };

  getArgoApplicationInformationBySelector = async (request, response) => {
    const argoAppSelector = request.params.argoAppSelector;
    const argoAppNamespace = request.query?.appNamespace;
    this.logger.info(
      `Getting apps for selector ${argoAppSelector} on ${request.params.argoInstanceName}`,
    );
    // TODO: needs auth middleware

    const resp = await this.argocdClient.getArgoAppData(
        request.instance[request.params.argoInstanceName].url,
        request.instance[request.params.argoInstanceName].name,
        request.instance[request.params.argoInstanceName].token,
      {
        selector: argoAppSelector,
        namespace: argoAppNamespace as string,
      },
    );
    return response.send(resp);
  };

  createArgoProjectAndApplication = async (request, response) => {
    const namespace = request.body.namespace;
    const projectName = request.body.projectName as string;
    const appName = request.body.appName as string;
    const labelValue = request.body.labelValue as string;
    const sourceRepo = request.body.sourceRepo;
    const sourcePath = request.body.sourcePath;
    try {
      await this.argocdClient.createArgoProject({
        baseUrl: request.instance[request.body.argoInstanceName].url,
        argoToken: request.instance[request.body.argoInstanceName].token,
        projectName,
        namespace,
        sourceRepo,
      });
    } catch (e: any) {
      this.logger.error(e);
      return response.status(e.status || 500).send({
        status: e.status,
        message: e.message || 'Failed to create argo project',
      });
    }

    try {
      await this.argocdClient.createArgoApplication({
        baseUrl: request.instance[request.params.argoInstanceName].url,
        argoToken: request.instance[request.params.argoInstanceName].token,
        projectName,
        appName,
        namespace,
        sourceRepo,
        sourcePath,
        labelValue,
      });
      return response.send({
        argoProjectName: projectName,
        argoAppName: appName,
        kubernetesNamespace: namespace,
      });
    } catch (e: any) {
      return response.status(500).send({
        status: 500,
        message: e.message || 'Failed to create argo app',
      });
    }
  };

  updateArgoProjectAndApp = async (request, response) => {
    const namespace = request.body.namespace;
    const projectName = request.body.projectName as string;
    const appName = request.body.appName as string;
    const labelValue = request.body.labelValue as string;
    const sourceRepo = request.body.sourceRepo;
    const sourcePath = request.body.sourcePath;

    try {
      await this.argocdClient.updateArgoProjectAndApp({
        instanceUrl: request.instance[request.params.argoInstanceName].url,
        instanceName: request.instance[request.params.argoInstanceName].name,
        argoToken: request.instance[request.params.argoInstanceName].token,
        projectName,
        appName,
        namespace,
        sourceRepo,
        sourcePath,
        labelValue,
      });
      
      return response.send({
        argoProjectName: projectName,
        argoAppName: appName,
        kubernetesNamespace: namespace,
      });
    } catch (e: any) {
      this.logger.error(e);
      return response.status(e.status || 500).send({
        status: e.status,
        message: e.message || 'Failed to create argo project',
      });
    }
  };

  syncAllArgoAppsBySelector = async (request, response) => {
    // TODO: NEED TO FIGURE THIS OUT! - Multiple Instances
    const appSelector = request.body.appSelector;
    try {
      const argoSyncResp = await this.argocdClient.resyncAppOnAllArgos({
        appSelector,
      });
      return response.send(argoSyncResp);
    } catch (e: any) {
      return response.status(e.status || 500).send({
        status: e.status || 500,
        message: e.message || `Failed to sync your app, ${appSelector}.`,
      });
    }
  };

  deleteArgoAppAndProject = async (request, response) => {
    const argoInstanceName: string = request.params.argoInstanceName;
    const argoAppName: string = request.params.argoAppName;
    this.logger.info(`Getting info on ${argoInstanceName} and ${argoAppName}`);

    const argoDeleteAppandProjectResp =
      await this.argocdClient.deleteAppandProject({
        argoAppName,
        argoInstanceName: request.instance[request.params.argoInstanceName].name,
        argoInstanceUrl: request.instance[request.params.argoInstanceName].url,
        argoInstanceToken: request.instance[request.params.argoInstanceName].token,
      });

    return response.send(argoDeleteAppandProjectResp);
  };

  getOneArgoApplicationInformationV2 = async (request, response) => { d
    const argoApplicationName: string = request.params.argoAppName;
    const applicationInformation =
      await this.argocdClient.getArgoApplicationInfo({
        argoApplicationName,
        argoInstanceName: request.instance[request.params.argoInstanceName].name,
        argoInstanceUrl: request.instance[request.params.argoInstanceName].url,
        argoInstanceToken: request.instance[request.params.argoInstanceName].token,
      });

    return response
      .status(applicationInformation.statusCode)
      .send(applicationInformation);
  };
}
