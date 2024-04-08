import { createServiceRef } from '@backstage/backend-plugin-api';
import { ArgoServiceApi } from '../types/types';

export const argocdServiceRef = createServiceRef<ArgoServiceApi>({
    id: 'argo-cd-backend.argoService'
});