import { errorHandler } from '@backstage/backend-common';
import { json, Router } from 'express';
import { Logger } from 'winston';
import { ArgocdController } from '../../controllers/argocd.controller';
import { ArgoServiceApi } from '../../types/types';
import { authenticateOneInstance } from '../../middleware/argocd.middleware';

export interface RouterOptions {
  logger: Logger;
  argoClient: ArgoServiceApi;
}

export function createRouter({
  logger,
  argoClient,
}: RouterOptions): Promise<Router> {
  const router = Router();
  router.use(json());
  router.use(authenticateOneInstance(argoClient));

  const argocdController = new ArgocdController(argoClient, logger);

  router.get('/allArgoApps/:argoInstanceName', authenticateOneInstance(argoClient), argocdController.getAllArgoApps);

  router.get(
    '/argoInstance/:argoInstanceName/repo/:repo/source/:source',
    authenticateOneInstance(argoClient),
    argocdController.doesAppExistWithRepoAndSourcePath,
  );

  router.get('/find/name/:argoAppName', argocdController.findAllArgoAppsByName);

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName/revisions/:revisionID/metadata',
    authenticateOneInstance(argoClient),
    argocdController.getAppRevisionData,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/name/:argoAppName',
    authenticateOneInstance(argoClient),
    argocdController.getOneArgoApplicationInformationV1,
  );

  router.get(
    '/find/selector/:argoAppSelector',
    argocdController.findAllArgoAppsBySelector,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/selector/:argoAppSelector',
    authenticateOneInstance(argoClient),
    argocdController.getArgoApplicationInformationBySelector,
  );

  router.post(
    '/createArgo', 
    authenticateOneInstance(argoClient),
    argocdController.createArgoProjectAndApplication
  );

  router.put(
    '/updateArgo/:argoAppName',
    authenticateOneInstance(argoClient),
    argocdController.updateArgoProjectAndApp,
  );

  router.post('/sync', argocdController.syncAllArgoAppsBySelector);

  router.delete(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    authenticateOneInstance(argoClient),
    argocdController.deleteArgoAppAndProject,
  );

  router.get(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    authenticateOneInstance(argoClient),
    argocdController.getOneArgoApplicationInformationV2,
  );

  router.use(errorHandler());
  return Promise.resolve(router);
}
