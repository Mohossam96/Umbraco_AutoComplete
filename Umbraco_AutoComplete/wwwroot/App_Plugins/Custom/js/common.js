(function () {
    angular.module('umbraco.services').provider('CustomFeatureConfig', function () {
        var configData = {};

        return {
            setConfig: function (config) {
                configData = config;
            },
            $get: function () {
                return configData;
            }
        };
    });

    angular.module('umbraco.services')
        .config(['$httpProvider', 'CustomFeatureConfigProvider', function ($httpProvider, CustomFeatureConfigProvider) {
            CustomFeatureConfigProvider.setConfig(window.__customFeatureConfig__ || {});

            $httpProvider.interceptors.push(['$q', 'CustomFeatureConfig', function ($q, CustomFeatureConfig, $http) {
               
                return {
                    request: function (request) {
                       
                        if (!request) return request;
                        
                        if (CustomFeatureConfig.enableAITextEditor && request.url.includes("/propertyeditors/textbox/textbox.html")) {
                            request.url = "/App_Plugins/AutoCompleteTitle/autocomplete-title.html";
                        }

                        if (CustomFeatureConfig.enableAIRichText && request.url.includes("/propertyeditors/rte/rte.html")) {
                            request.url = "/App_Plugins/AIRichTextComponent/ai-richtext-editor-Copy.html";
                        }

                        if (CustomFeatureConfig.enableAITags && request.url.includes("/propertyeditors/tags/tags.html")) {
                            request.url = "/App_Plugins/AITags/AITags.html";
                        }

                        return request;
                    }
                };
            }]);
        }]);

})();
