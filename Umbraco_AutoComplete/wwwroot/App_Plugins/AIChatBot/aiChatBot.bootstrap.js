angular.module('umbraco').run(function ($rootScope, $compile, $document,$http) {
    $http.get('/App_Plugins/Custom/config.json').then(function (res) {
        configs = res.data;
        if (configs.enableAIChatBot) {
            var body = $document.find('body').eq(0);
            var el = angular.element('<ai-chat-bot></ai-chat-bot>');
            body.append(el);
            $compile(el)($rootScope);
        }
    });
   
});