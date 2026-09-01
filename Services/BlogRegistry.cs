namespace Oxyniti.Services;

/// <summary>
/// One entry in <see cref="BlogRegistry.Posts"/> — just enough to render the
/// /blogs index card and link to the post's own page.
/// </summary>
public record BlogPostSummary(string Slug, string Title, string Summary, DateOnly PublishedOn);

/// <summary>
/// The list of published posts under /blogs (see
/// https://github.com/revred/Oxiniti/issues/70). Starts empty: no placeholder
/// or fabricated post belongs here — every entry must correspond to something
/// real the team stands behind (a genuine field-trial write-up, a technical
/// explainer, a press mention), never invented data. Unverifiable content is
/// exactly what CONTRIBUTING.md's no-fake-provenance rule exists to keep off
/// this site. The /blogs index page keeps the section out of search results
/// (`noindex`) for as long as this list is empty.
/// <para>
/// To publish a post:
/// 1. Add a <see cref="BlogPostSummary"/> entry below.
/// 2. Create <c>Pages/Blogs/Posts/{Slug}.razor</c> with
///    <c>@page "/blogs/{slug}"</c>, following the static-page pattern in
///    <c>Pages/About.razor</c> (PageTitle, canonical link, meta description,
///    then content) plus a BlogPosting JSON-LD block — see the VideoObject
///    blocks in <c>Pages/Home.razor</c> for the ld+json syntax to mirror.
/// </para>
/// </summary>
public static class BlogRegistry
{
    public static readonly IReadOnlyList<BlogPostSummary> Posts = [];
}
