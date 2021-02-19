
export class Environment {
    static getCollectionPrefix(envProd: boolean)
    {
        if (envProd) return 'production/production/';
        return 'debug/debug/'
    }

    static getFullPath(envProd: boolean, path : String)
    {
        return Environment.getCollectionPrefix(envProd) + path;
    }

}