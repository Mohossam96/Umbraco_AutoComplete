//angular.module("umbraco").controller("aiRichTextEditorController", function ($scope, $http, $timeout) {
//    $scope.aiPrompt = "";
//    $scope.isLoading = false;

//    $scope.generateDescription = function () {
//        if (!$scope.aiPrompt) return;

//        $scope.isLoading = true;

//        $http.post("/umbraco/backoffice/AIHelper/Completion/GetRichTextSuggestion?input=" + $scope.aiPrompt)
//            .then(function (res) {
//                const content = res.data;
//                const editor = tinymce.get("tinymce-editor");
//                if (editor) {
//                    editor.setContent(content);
//                    $scope.model.value = content;
//                }
//                $scope.isLoading = false;
//            })
//            .catch(function () {
//                $scope.isLoading = false;
//                alert("Something went wrong.");
//            });
//    };

//    $timeout(() => {
//        const existing = tinymce.get("tinymce-editor");
//        if (existing) {
//            existing.remove(); // Destroy old instance to allow fresh config
//        }
//        tinymce.init({
//            selector: "#tinymce-editor",
//            menubar: false,
//            height: 300,
//            statusbar: false,
//            plugins: "link lists",
//            toolbar: "undo redo | bold italic | bullist numlist | link",
//            setup: function (editor) {
//                editor.on('init', function () {
//                    editor.setContent($scope.model.value || "");
//                });

//                editor.on('change keyup', function () {
//                    $timeout(() => {
//                        $scope.model.value = editor.getContent();
//                    });
//                });
//            }
//        });
//    }, 500);

//    $scope.$on("formSubmitting", function () {
//        const editor = tinymce.get("tinymce-editor");
//        if (editor) {
//            $scope.model.value = editor.getContent();
//        }
//    });
//});
