window.__customFeatureConfig__ = {};

fetch('/App_Plugins/Custom/config.json')
    .then(res => {
        console.log("Loading custom feature config from /App_Plugins/Custom/config.json", res);

        return res.json()
    })
    .then(config => {
        console.log("Parsed config JSON:", config);
        window.__customFeatureConfig__ = config;
    });
