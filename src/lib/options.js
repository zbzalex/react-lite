define(function() {
    return {
        nextUnitOfWork: null,
        currentRoot: null,
        oldCommitRoot: null,
        deletions: [],
        currentComponent: null,
        hookIndex: 0,
        pendingEffects: [],
    }
});