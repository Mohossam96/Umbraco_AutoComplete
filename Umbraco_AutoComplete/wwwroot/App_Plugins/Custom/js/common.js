(function () {
    
    angular.module('umbraco.services').config([
        '$httpProvider', function ($httpProvider) {

            $httpProvider.interceptors.push(['$q', function ($q) {
                return {
                    request: function (request) {
                        if (request) {
                            
                            if (request.url.includes("/propertyeditors/textbox/textbox.html")) {
                                debugger
                                request.url = "/App_Plugins/AutoCompleteTitle/autocomplete-title.html";
                            }
                            
                            if (request.url.includes("/propertyeditors/rte/rte.html")) {
                                debugger;
                                request.url = "/App_Plugins/AIRichTextComponent/ai-richtext-editor-Copy.html";
                            }
                            // tag editor
                            if (request.url.includes("/propertyeditors/tags/tags.html")) {
                                debugger;
                                request.url = "/App_Plugins/AITags/AITags.html";
                            }

                        }
                        return request;
                    }
                };
            }]);
        }])
       
})();
