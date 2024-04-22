import { authenticateOneInstance } from './argocd.middleware';
import { ArgoServiceApi } from '../types/types';

describe('argoCDAuthMiddleware', () => {
    const getArgoInstanceArrayMock = jest.fn();
    const getArgoTokenMock = jest.fn();
    const argoServiceMock = {
        getArgoInstanceArray: getArgoInstanceArrayMock,
        getArgoToken: getArgoTokenMock,
    } as any as ArgoServiceApi
    const argoMiddleware = authenticateOneInstance(argoServiceMock);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('authenticates one instance by attaching token', async () => {
        await argoMiddleware({ method: 'GET' } as any, {} as any, jest.fn());
    });

    // it('authenticates one instance when request contains a parameter of the instance', async () => {
    //     await argoMiddleware({ method: 'GET' } as any, {} as any, jest.fn());
    //     // expect(mockBackstageMiddleware).toHaveBeenCalled();
    // });
    // it('authenticates one instance when request body contains the instance information', async () => {
    //     await argoMiddleware({ method: 'GET' } as any, {} as any, jest.fn());
    //     // expect(mockBackstageMiddleware).toHaveBeenCalled();
    // });
    // it('fails to authenticate with bad response type when instance information not found', async () => {
    //     await argoMiddleware({ method: 'GET' } as any, {} as any, jest.fn());
    //     // expect(mockBackstageMiddleware).toHaveBeenCalled();
    // });
});
