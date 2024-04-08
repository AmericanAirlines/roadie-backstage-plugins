import { ArgoService } from "../service/argocd.service";



class ArgoServiceController {
    constructor(private argoService: ArgoService) {}

    getOneArgoApp = async (request, response) => {
        const argoInstanceName = request.params.argoInstanceName;
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
    
        if (!token) {
          return response.status(500).send({
            status: 'failed',
            message: 'could not generate token',
          });
        }
        return response.send(
          await argoSvc.getArgoAppData(
            matchedArgoInstance.url,
            matchedArgoInstance.name,
            token,
          ),
        );
      }
}


// const handler1 = (argoSvc: ArgoService) => async (request, response) => {
//     const argoInstanceName = request.params.argoInstanceName;
//     const matchedArgoInstance = getArgoConfigByInstanceName({
//       argoInstanceName,
//       argoConfigs: argoSvc.getArgoInstanceArray(),
//     });

//     if (matchedArgoInstance === undefined) {
//       return response.status(500).send({
//         status: 'failed',
//         message: 'cannot find an argo instance to match this cluster',
//       });
//     }
//     const token: string =
//       matchedArgoInstance.token ??
//       (await argoSvc.getArgoToken(matchedArgoInstance));

//     if (!token) {
//       return response.status(500).send({
//         status: 'failed',
//         message: 'could not generate token',
//       });
//     }
//     return response.send(
//       await argoSvc.getArgoAppData(
//         matchedArgoInstance.url,
//         matchedArgoInstance.name,
//         token,
//       ),
//     );
//   });