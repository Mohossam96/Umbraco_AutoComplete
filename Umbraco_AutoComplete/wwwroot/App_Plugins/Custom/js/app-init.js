
window.name = 'NG_DEFER_BOOTSTRAP!';

fetch('/App_Plugins/Custom/config.json')
    .then(res => res.json())
    .then(config => {
        console.log("Custom feature config loaded:", config);
        window.__customFeatureConfig__ = config;
        angular.resumeBootstrap(['umbraco']);
    })
    .catch(err => {
        console.error("Failed to load config.json", err);
        angular.resumeBootstrap(['umbraco']); // ensure boot
    });
