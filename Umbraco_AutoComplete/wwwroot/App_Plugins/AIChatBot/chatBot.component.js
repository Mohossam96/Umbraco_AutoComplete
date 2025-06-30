angular.module('umbraco').component('aiChatBot', {
    template: `
    <div ng-if="$ctrl.showChat" class="ai-chat-window resizable">
       <div class="ai-resize-handle" ng-mousedown="$ctrl.startResize($event)"></div>
<div class="ai-chat-header">
    AI Chatbot
    <span class="close-btn" ng-click="$ctrl.toggleChat()">×</span>
</div>

       <div class="ai-chat-body">
    <div ng-repeat="msg in $ctrl.messages track by $index"
         ng-class="{'ai-chat-bubble': true, 'ai-user': msg.role === 'user', 'ai-ai': msg.role === 'ai'}"
         ng-bind-html="msg.html">
    </div>

    <div ng-if="$ctrl.loading" class="ai-chat-loading">Loading...</div>
    <div ng-if="!$ctrl.loading && !$ctrl.messages.length" class="ai-chat-placeholder">Ask me something!</div>
</div>


        <div class="ai-chat-input">
            <input type="text" ng-model="$ctrl.userInput"
                   ng-keydown="$ctrl.checkSubmit($event)" placeholder="Type your question..." />
            <button type="button" class="btn" ng-click="$ctrl.sendPrompt()" ng-disabled="$ctrl.loading">Send</button>
        </div>
    </div>
    <div class="ai-chat-button" ng-click="$ctrl.toggleChat()">💬</div>
`,

    controller: function ($http, $sce, $timeout, $document, notificationsService) {
        
        var vm = this;
        vm.showChat = false;
        vm.userInput = '';
        vm.messages = [];  // ⬅️ Store all chat messages
        vm.loading = false;

        vm.toggleChat = function () {
            vm.showChat = !vm.showChat;
        };

        vm.checkSubmit = function (event) {
            if (event.key === 'Enter') {
                vm.sendPrompt();
            }
        };
        vm.startResize = function (event) {
            event.preventDefault();
            const chatWindow = event.target.closest('.ai-chat-window');
            const startY = event.clientY;
            const startHeight = chatWindow.offsetHeight;
            const startTop = chatWindow.offsetTop;

            function onMouseMove(e) {
                const dy = e.clientY - startY;
                const newHeight = startHeight - dy;
                const newTop = startTop + dy;

                // Minimum height (150px), and minimum top (stays within viewport)
                const minHeight = 150;
                const minTop = 0;

                if (newHeight > minHeight && newTop >= minTop) {
                    chatWindow.style.height = newHeight + 'px';
                    chatWindow.style.top = newTop + 'px';
                }
                const maxHeight = window.innerHeight - 40; // leave some breathing room

                if (newHeight > minHeight && newHeight < maxHeight && newTop >= minTop) {
                    chatWindow.style.height = newHeight + 'px';
                    chatWindow.style.top = newTop + 'px';
                }

            }


            function onMouseUp() {
                $document.off('mousemove', onMouseMove);
                $document.off('mouseup', onMouseUp);
            }

            $document.on('mousemove', onMouseMove);
            $document.on('mouseup', onMouseUp);
        };

        vm.sendPrompt = function () {
            if (!vm.userInput || vm.loading) return;

            const prompt = vm.userInput;
            vm.userInput = '';
            vm.loading = true;

            // Add user's message to history
            vm.messages.push({ role: 'user', html: $sce.trustAsHtml(prompt) });

            $http.post('/umbraco/backoffice/AIHelper/Completion/GetChatReply',
                JSON.stringify({ input: prompt }),
            {
                headers: { 'Content-Type': 'application/json' }
            }).then(function (res) {
                if (res.data.StatusCode == 429)
                {
                    // pop up message
                    // notificationsService message
                    notificationsService.error('You have reached the maximum number of requests for today. Please try again later.');
                    vm.messages.push({ role: 'ai', html: $sce.trustAsHtml('<i>Too many requests. Please try again later.</i>') });
                    vm.loading = false;
                    return;
                }
                const html = marked.parse(res.data.Response || '');
                vm.messages.push({ role: 'ai', html: $sce.trustAsHtml(html) });
                vm.loading = false;

                // Optional: auto-scroll to bottom after DOM updates
                $timeout(() => {
                    const el = document.querySelector('.ai-chat-body');
                    if (el) el.scrollTop = el.scrollHeight;
                }, 50);

            }, function () {
                vm.messages.push({ role: 'ai', html: $sce.trustAsHtml('<i>Something went wrong.</i>') });
                vm.loading = false;
            });
        };
    }
     

});
