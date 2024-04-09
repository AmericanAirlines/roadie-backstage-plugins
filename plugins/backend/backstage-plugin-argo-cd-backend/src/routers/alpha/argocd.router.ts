import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { ArgoService } from '../../service/argocd.service';
import { getArgoConfigByInstanceName } from '../../utils/getArgoConfig';
import { ArgocdController } from '../../controllers/argocd.controller'
import { ArgoServiceApi } from '../../types/types';

export interface RouterOptions {
  logger: Logger;
  argoClient: ArgoServiceApi;
}

export type Response = {
  status: string;
  message: string;
};

export function createRouter({
  logger,
  argoClient
}: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const argocdController = new ArgocdController(argoClient, logger);
  
  router.get('/allArgoApps/:argoInstanceName', argocdController.getOneArgoApp);

  router.get('/argoInstance/:argoInstance/repo/:repo/source/:source', argocdController.doesAppExistWithRepoAndSourcePath);

  router.get('/find/name/:argoAppName', argocdController.getArgoAppByName);

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName/revisions/:revisionID/metadata',argocdController.getRevisionData);

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName',
    async (request, response) => {
      const argoInstanceName: string = request.params.argoInstanceName;
      const argoAppName = request.params.argoAppName;
      const argoAppNamespace = request.query?.appNamespace;
      logger.info(`Getting info on ${argoAppName}`);
      logger.info(`Getting app ${argoAppName} on ${argoInstanceName}`);
      const matchedArgoInstance = getArgoConfigByInstanceName({
        argoInstanceName,
        argoConfigs: argoSvc.getArgoInstanceArray(),
      });
      if (matchedArgoInstance === undefined) {
        return response.status(500).send({
          status: 'failed',
          message: 'cannot find an argo instance to match this cluster',
        });
      }
      const token: string =
        matchedArgoInstance.token ??
        (await argoSvc.getArgoToken(matchedArgoInstance));

      const resp = await argoSvc.getArgoAppData(
        matchedArgoInstance.url,
        matchedArgoInstance.name,
        token,
        { name: argoAppName, namespace: argoAppNamespace as string },
      );
      return response.send(resp);
    },
  );
  router.get('/find/selector/:argoAppSelector', async (request, response) => {
    const argoAppSelector = request.params.argoAppSelector;
    const argoAppNamespace = request.query?.appNamespace;
    logger.info(`Getting apps for selector ${argoAppSelector}`);
    response.send(
      await argoSvc.findArgoApp({
        selector: argoAppSelector,
        namespace: argoAppNamespace as string,
      }),
    );
  });
  router.get(
    '/argoInstance/:argoInstanceName/applications/selector/:argoAppSelector',
    async (request, response) => {
      const argoInstanceName = request.params.argoInstanceName;
      const argoAppSelector = request.params.argoAppSelector;
      const argoAppNamespace = request.query?.appNamespace;
      logger.info(
        `Getting apps for selector ${argoAppSelector} on ${argoInstanceName}`,
      );
      const matchedArgoInstance = getArgoConfigByInstanceName({
        argoInstanceName,
        argoConfigs: argoSvc.getArgoInstanceArray(),
      });
      if (matchedArgoInstance === undefined) {
        return response.status(500).send({
          status: 'failed',
          message: 'cannot find an argo instance to match this cluster',
        });
      }
      const token: string =
        matchedArgoInstance.token ??
        (await argoSvc.getArgoToken(matchedArgoInstance));

      const resp = await argoSvc.getArgoAppData(
        matchedArgoInstance.url,
        matchedArgoInstance.name,
        token,
        {
          selector: argoAppSelector,
          namespace: argoAppNamespace as string,
        },
      );
      return response.send(resp);
    },
  );
  router.post('/createArgo', async (request, response) => {
    const argoInstanceName: string = request.body.clusterName;
    const namespace = request.body.namespace;
    const projectName = request.body.projectName as string;
    const appName = request.body.appName as string;
    const labelValue = request.body.labelValue as string;
    const sourceRepo = request.body.sourceRepo;
    const sourcePath = request.body.sourcePath;
    const matchedArgoInstance = getArgoConfigByInstanceName({
      argoInstanceName,
      argoConfigs: argoSvc.getArgoInstanceArray(),
    });
    if (matchedArgoInstance === undefined) {
      return response.status(500).send({
        status: 'failed',
        message: 'cannot find an argo instance to match this cluster',
      });
    }
    let token: string;
    if (!matchedArgoInstance.token) {
      try {
        token = await argoSvc.getArgoToken(matchedArgoInstance);
      } catch (e: any) {
        return response.status(e.status || 500).send({
          status: e.status,
          message: e.message,
        });
      }
    } else {
      token = matchedArgoInstance.token;
    }
    try {
      await argoSvc.createArgoProject({
        baseUrl: matchedArgoInstance.url,
        argoToken: token,
        projectName,
        namespace,
        sourceRepo,
      });
    } catch (e: any) {
      logger.error(e);
      return response.status(e.status || 500).send({
        status: e.status,
        message: e.message || 'Failed to create argo project',
      });
    }

    try {
      await argoSvc.createArgoApplication({
        baseUrl: matchedArgoInstance.url,
        argoToken: token,
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
  });
  router.put('/updateArgo/:argoAppName', async (request, response) => {
    const argoInstanceName: string = request.body.clusterName;
    const namespace = request.body.namespace;
    const projectName = request.body.projectName as string;
    const appName = request.body.appName as string;
    const labelValue = request.body.labelValue as string;
    const sourceRepo = request.body.sourceRepo;
    const sourcePath = request.body.sourcePath;
    const matchedArgoInstance = getArgoConfigByInstanceName({
      argoInstanceName,
      argoConfigs: argoSvc.getArgoInstanceArray(),
    });

    if (matchedArgoInstance === undefined) {
      return response.status(500).send({
        status: 'failed',
        message: 'cannot find an argo instance to match this cluster',
      });
    }
    let token: string;
    if (!matchedArgoInstance.token) {
      try {
        token = await argoSvc.getArgoToken(matchedArgoInstance);
      } catch (e: any) {
        return response.status(e.status || 500).send({
          status: e.status,
          message: e.message,
        });
      }
    } else {
      token = matchedArgoInstance.token;
    }

    try {
      await argoSvc.updateArgoProjectAndApp({
        instanceConfig: matchedArgoInstance,
        argoToken: token,
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
      logger.error(e);
      return response.status(e.status || 500).send({
        status: e.status,
        message: e.message || 'Failed to create argo project',
      });
    }
  });
  router.post('/sync', async (request, response) => {
    const appSelector = request.body.appSelector;
    try {
      const argoSyncResp = await argoSvc.resyncAppOnAllArgos({ appSelector });
      return response.send(argoSyncResp);
    } catch (e: any) {
      return response.status(e.status || 500).send({
        status: e.status || 500,
        message: e.message || `Failed to sync your app, ${appSelector}.`,
      });
    }
  });
  router.delete(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    async (request, response) => {
      const argoInstanceName: string = request.params.argoInstanceName;
      const argoAppName: string = request.params.argoAppName;
      logger.info(`Getting info on ${argoInstanceName} and ${argoAppName}`);

      const argoDeleteAppandProjectResp = await argoSvc.deleteAppandProject({
        argoAppName,
        argoInstanceName,
      });
      return response.send(argoDeleteAppandProjectResp);
    },
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    async (request, response) => {
      const argoInstanceName: string = request.params.argoInstanceName;
      const argoApplicationName: string = request.params.argoAppName;

      const applicationInformation = await argoSvc.getArgoApplicationInfo({
        argoApplicationName,
        argoInstanceName,
      });

      return response
        .status(applicationInformation.statusCode)
        .send(applicationInformation);
    },
  );

  router.use(errorHandler());
  return Promise.resolve(router);
}
