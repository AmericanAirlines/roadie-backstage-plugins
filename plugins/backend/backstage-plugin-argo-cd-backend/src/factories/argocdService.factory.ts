import { coreServices, createServiceFactory } from '@backstage/backend-plugin-api';
import { ArgoService } from '../service/argocd.service';
import { argocdServiceRef } from '../refs/argocdService.ref';


export const argocdServiceFactory = createServiceFactory({
    service: argocdServiceRef,
    deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig
    },
    factory({ logger, config }) {
        const argoUserName =
            config.getOptionalString('argocd.username') ?? 'argocdUsername';
        const argoPassword =
            config.getOptionalString('argocd.password') ?? 'argocdPassword';
        return new ArgoService(argoUserName, argoPassword, config, logger);
    }
});