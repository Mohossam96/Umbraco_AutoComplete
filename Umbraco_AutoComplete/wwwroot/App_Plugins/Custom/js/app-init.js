
window.name = 'NG_DEFER_BOOTSTRAP!';

fetch('/App_Plugins/Custom/config.json')
    .then(res => res.json())
    .then(config => {
        
        window.__customFeatureConfig__ = config;
        angular.resumeBootstrap(['umbraco']);
    })
    .catch(err => {
        
        angular.resumeBootstrap(['umbraco']); // ensure boot
    });
