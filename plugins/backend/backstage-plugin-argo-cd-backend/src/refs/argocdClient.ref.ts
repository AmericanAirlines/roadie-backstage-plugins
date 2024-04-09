import { createServiceRef } from '@backstage/backend-plugin-api';
import { ArgoServiceApi } from '../types/types';

export const argocdClientServiceRef = createServiceRef<ArgoServiceApi>({
    id: 'argo-cd-backend.argocdClient'
});