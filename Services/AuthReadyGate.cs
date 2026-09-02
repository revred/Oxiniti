namespace Oxyniti.Services;

// MainLayout kicks off AuthenticationService.InitializeAsync() (rehydrates the
// token from localStorage) on every app boot, but a routed page's own
// OnInitializedAsync starts around the same tick -- before that rehydration
// finishes -- so a page that reads AuthenticationService.IsAuthenticated on
// load can see the freshly-constructed "false" default and redirect to
// /login on a hard refresh, even though a valid token is sitting in storage.
// Pages that guard on auth state should await Ready first.
public class AuthReadyGate
{
    private readonly TaskCompletionSource _tcs =
        new(TaskCreationOptions.RunContinuationsAsynchronously);

    public Task Ready => _tcs.Task;

    public void SignalReady() => _tcs.TrySetResult();
}
