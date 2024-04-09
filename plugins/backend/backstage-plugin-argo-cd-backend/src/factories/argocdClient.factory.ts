import { coreServices, createServiceFactory } from '@backstage/backend-plugin-api';
import { ArgoService } from '../service/argocd.service';
import { argocdClientServiceRef } from '../refs/argocdClient.ref';


export const argocdClientServiceFactory = createServiceFactory({
    service: argocdClientServiceRef,
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