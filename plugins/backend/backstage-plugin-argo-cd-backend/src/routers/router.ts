import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { ArgoService } from '../service/argocd.service';
import { getArgoConfigByInstanceName } from '../utils/getArgoConfig';
import { ArgocdController } from '../controllers';
import { authenticateOneInstance } from '../middleware/argocd.middleware';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}
export type Response = {
  status: string;
  message: string;
};
export function createRouter({
  logger,
  config,
}: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const argoUserName =
    config.getOptionalString('argocd.username') ?? 'argocdUsername';
  const argoPassword =
    config.getOptionalString('argocd.password') ?? 'argocdPassword';
  const argoSvc = new ArgoService(argoUserName, argoPassword, config, logger);
  const argocdController = new ArgocdController(argoSvc, logger);

  router.get('/allArgoApps/:argoInstanceName', authenticateOneInstance(argoSvc), argocdController.getAllArgoApps);

  router.get(
    '/argoInstance/:argoInstanceName/repo/:repo/source/:source',
    argocdController.doesAppExistWithRepoAndSourcePath,
  );

  router.get('/find/name/:argoAppName', argocdController.findAllArgoAppsByName);

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName/revisions/:revisionID/metadata',
    argocdController.getAppRevisionData,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName',
    argocdController.getOneArgoApplicationInformationV1,
  );

  router.get(
    '/find/selector/:argoAppSelector',
    argocdController.findAllArgoAppsBySelector,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/selector/:argoAppSelector',
    argocdController.getArgoApplicationInformationBySelector,
  );

  router.post('/createArgo', argocdController.createArgoProjectAndApplication);

  router.put(
    '/updateArgo/:argoAppName',
    argocdController.updateArgoProjectAndApp,
  );

  router.post('/sync', argocdController.syncAllArgoAppsBySelector);

  router.delete(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    argocdController.deleteArgoAppAndProject,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    argocdController.getOneArgoApplicationInformationV2,
  );

  router.use(errorHandler());
  return Promise.resolve(router);
}
