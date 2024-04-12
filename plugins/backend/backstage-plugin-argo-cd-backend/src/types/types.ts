import { Config } from '@backstage/config';
import { Logger } from 'winston';

export type getRevisionDataResp = {
  author: string;
  date: string;
  message: string;
};

export type findArgoAppResp = {
  name: string;
  url: string;
  appName: Array<string>;
};

export type SyncResponse = {
  status: 'Success' | 'Failure';
  message: string;
};

export interface CreateArgoProjectProps {
  baseUrl: string;
  argoToken: string;
  projectName: string;
  namespace: string;
  sourceRepo: string;
  destinationServer?: string;
}

export interface UpdateArgoProjectProps {
  baseUrl: string;
  argoToken: string;
  projectName: string;
  namespace: string;
  sourceRepo: string | string[];
  resourceVersion: string;
  destinationServer?: string;
}

export interface CreateArgoApplicationProps {
  baseUrl: string;
  argoToken: string;
  appName: string;
  projectName: string;
  namespace: string;
  sourceRepo: string;
  sourcePath: string;
  labelValue: string;
  destinationServer?: string;
}

export interface UpdateArgoApplicationProps extends CreateArgoApplicationProps {
  resourceVersion: string;
}

export interface CreateArgoResourcesProps {
  argoInstance: string;
  appName: string;
  projectName: string;
  namespace: string;
  sourceRepo: string;
  sourcePath: string;
  labelValue: string;
  logger: Logger;
}

export interface UpdateArgoProjectAndAppProps {
  instanceUrl: string;
  instanceName: string;
  argoToken: string;
  appName: string;
  projectName: string;
  namespace: string;
  sourceRepo: string;
  sourcePath: string;
  labelValue: string;
  destinationServer?: string;
}

export interface DeleteProjectProps {
  baseUrl: string;
  argoProjectName: string;
  argoToken: string;
}

export interface DeleteApplicationProps {
  baseUrl: string;
  argoApplicationName: string;
  argoToken: string;
}

export interface DeleteApplicationAndProjectProps {
  argoAppName: string;
  argoInstanceName: string;
  argoInstanceUrl: string;
  argoInstanceToken: string;
}

export type DeleteApplicationAndProjectResponse = {
  argoDeleteAppResp: ResponseSchema;
  argoDeleteProjectResp: ResponseSchema;
};

export type ResponseSchema = {
  status: string;
  message: string;
};

export interface SyncArgoApplicationProps {
  argoInstance: findArgoAppResp;
  argoToken: string;
  appName: string;
}

export interface ResyncProps {
  appSelector: string;
}

export interface ArgoServiceApi {
  getArgoInstanceArray: () => InstanceConfig[];
  getAppArray: () => Config[];
  getArgoToken: (appConfig: {
    url: string;
    username?: string;
    password?: string;
  }) => Promise<string>;
  getArgoAppData: (
    baseUrl: string,
    argoInstanceName: string,
    argoToken: string,
    options?: {
      name?: string;
      selector?: string;
      namespace?: string;
    },
  ) => Promise<Record<string, any>>;
  createArgoProject: (
    props: CreateArgoProjectProps,
  ) => Promise<Record<string, any>>;
  createArgoApplication: (
    props: CreateArgoApplicationProps,
  ) => Promise<Record<string, any>>;
  createArgoResources: (props: CreateArgoResourcesProps) => Promise<boolean>;
  getRevisionData: (
    baseUrl: string,
    options: {
      name: string;
      namespace?: string;
    },
    argoToken: string,
    revisionID: string,
  ) => Promise<getRevisionDataResp>;
  deleteProject: (props: DeleteProjectProps) => Promise<boolean>;
  deleteApp: (props: DeleteApplicationProps) => Promise<boolean>;
  deleteAppandProject: (
    props: DeleteApplicationAndProjectProps,
  ) => Promise<DeleteApplicationAndProjectResponse>;
  syncArgoApp: (props: SyncArgoApplicationProps) => Promise<SyncResponse>;
  resyncAppOnAllArgos: (props: {
    appSelector: string;
  }) => Promise<SyncResponse[][]>;
  findArgoApp: (options: {
    name?: string;
    selector?: string;
    namespace?: string;
  }) => Promise<findArgoAppResp[]>;
  updateArgoProjectAndApp: (
    props: UpdateArgoProjectAndAppProps,
  ) => Promise<boolean>;
  getArgoProject: (props: GetArgoProjectProps) => Promise<GetArgoProjectResp>;
  getArgoApplicationInfo: (props: {
    argoApplicationName: string;
    argoInstanceName: string;
    argoInstanceUrl: string;
    argoInstanceToken: string;
  }) => Promise<
    | {
        statusCode: 401 | 404 | 200;
        message: string;
        error: string;
        code: number;
      }
    | {
        statusCode: 401 | 404 | 200;
        metadata: Metadata;
      }
  >;
}

export type InstanceConfig = {
  name: string;
  password?: string;
  token?: string;
  url: string;
  username?: string;
};

export type BuildArgoProjectArgs = {
  projectName: string;
  namespace: string;
  sourceRepo: string | string[];
  resourceVersion?: string;
  destinationServer?: string;
  clusterResourceBlacklist?: ResourceItem[];
  clusterResourceWhitelist?: ResourceItem[];
};

export type BuildArgoApplicationArgs = {
  appName: string;
  projectName: string;
  namespace: string;
  sourceRepo: string;
  sourcePath: string;
  labelValue: string;
  resourceVersion?: string;
  destinationServer?: string;
};

export type GetArgoProjectProps = {
  baseUrl: string;
  argoToken: string;
  projectName: string;
};

// Many more fields available, can be added as needed
export type GetArgoProjectResp = {
  metadata: {
    resourceVersion: string;
  };
};

export type FetchResponse<T, K> = Omit<Response, 'json'> & {
  status: K;
  json: () => Promise<T>;
};

export type GetArgoApplicationResp =
  | FetchResponse<{ message: string; error: string; code: number }, 401 | 404>
  | FetchResponse<ArgoApplication, 200>;

export type ArgoProject = {
  metadata: Metadata;
  spec: ArgoProjectSpec;
};

export type ArgoApplication = {
  metadata: Metadata;
};

export type Destination = {
  name: string;
  namespace: string;
  server: string;
};

export type ArgoProjectSpec = {
  destinations: Destination[];
  sourceRepos: string[];
  clusterResourceBlacklist?: ResourceItem[];
  clusterResourceWhitelist?: ResourceItem[];
  namespaceResourceBlacklist?: ResourceItem[];
  namespaceResourceWhitelist?: ResourceItem[];
};

export type Metadata = {
  name: string;
  namespace?: string;
  uid?: string;
  creationTimestamp?: string;
  deletionTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  resourceVersion?: string;
};

export type ResourceItem = {
  group: string;
  kind: string;
};
