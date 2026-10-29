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
    // Safety net: a page never waits longer than this, even if the layout
    // never signals (a hung call or an exception before the finally block).
    private static readonly TimeSpan MaxWait = TimeSpan.FromSeconds(10);

    private readonly TaskCompletionSource _tcs =
        new(TaskCreationOptions.RunContinuationsAsynchronously);

    public Task Ready => _tcs.Task.IsCompleted
        ? Task.CompletedTask
        : Task.WhenAny(_tcs.Task, Task.Delay(MaxWait));

    public void SignalReady() => _tcs.TrySetResult();
}
