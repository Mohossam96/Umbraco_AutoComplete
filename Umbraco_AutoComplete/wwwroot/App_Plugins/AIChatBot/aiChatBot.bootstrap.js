angular.module('umbraco').run(function ($rootScope, $compile, $document) {
    var configs = window.__customFeatureConfig__ || {};

    if (configs.enableAIChatBot) {
        var body = $document.find('body').eq(0);
        var el = angular.element('<ai-chat-bot></ai-chat-bot>');
        body.append(el);
        $compile(el)($rootScope);
    }
});
