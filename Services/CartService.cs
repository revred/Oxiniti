using Maker.RampEdge;
using Maker.RampEdge.Services.Contracts;
using Microsoft.JSInterop;
using System.Text.Json;

namespace Oxiniti.Services;

public class CartService(IJSRuntime jsRuntime, IAuthenticationService authenticationService, IMakerClient makerClient)
{
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private readonly IAuthenticationService _authenticationService = authenticationService;
    private readonly IMakerClient _makerSecureClient = makerClient;

    private const string StorageKey = "oxiniti_cart";

    public event Action? OnChange;

    private void NotifyStateChanged() => OnChange?.Invoke();

    public async Task<List<CartItem>> GetCartItems()
    {
        if (_authenticationService.IsAuthenticated)
        {
            try
            {
                return (await _makerSecureClient.GetCartAsync()).CartItem.ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CartService] Error in GetCartItems: {ex}");
                return [];
            }
        }

        return await GetLocalCartItems();
    }

    public async Task<int> AddToCart(ProductDetailsReply product, int? quantity = null) =>
     await AddToCartCore(
         slug: product.Slug,
         barId: product.BarID,
         name: product.Name,
         description: product.Description,
         price: product.Price,
         assets: product.Assets ?? [],
         quantity: quantity
     );

    public async Task<int> AddToCart(ProductData product, int? quantity = null) =>
        await AddToCartCore(
            slug: product.Slug,
            barId: product.BarID,
            name: product.Name,
            description: product.Description,
            price: product.Price,
            assets: product.Asset is null ? [] : [product.Asset],
            quantity: quantity
        );

    private static int NormalizeQuantity(int? quantity) =>
        quantity.HasValue && quantity.Value > 0 ? quantity.Value : 1;

    private async Task<int> AddToCartCore(
        string slug,
        long barId,
        string name,
        string description,
        double price,
        IEnumerable<DigitalAsset> assets,
        int? quantity)
    {
        var cart = await GetCartItems();
        var finalQuantity = NormalizeQuantity(quantity);

        var existing = cart.FirstOrDefault(c => c.Slug == slug);
        if (existing is not null)
        {
            existing.Quantity = finalQuantity;
        }
        else
        {
            cart.Add(new CartItem
            {
                Slug = slug,
                Quantity = finalQuantity,
                Assets = assets?.ToList() ?? [],
                BarId = barId,
                Description = description,
                Name = name,
                Price = price
            });
        }

        await PersistCart(cart);
        NotifyStateChanged();
        return finalQuantity;
    }

    private async Task PersistCart(List<CartItem> cart)
    {
        if (_authenticationService.IsAuthenticated)
        {
            try
            {
                await _makerSecureClient.AddProductsToCartAsync(new AddCartRequest
                {
                    CartItem = [.. cart.Select(i => new AddToCartItem { Slug = i.Slug, Quantity = i.Quantity })]
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CartService] Error in PersistCart: {ex}");
            }
        }
        else
        {
            await SaveCart(cart);
        }
    }

    public async Task RemoveFromCart(string productSlug)
    {
        if (_authenticationService.IsAuthenticated)
        {
            try
            {
                await _makerSecureClient.RemoveProductFromTheCartAsync(new RemoveProductRequest()
                {
                    Slug = productSlug
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CartService] Error in RemoveFromCart: {ex}");
            }
        }
        else
        {
            var cart = await GetLocalCartItems();
            cart.RemoveAll(c => c.Slug == productSlug);
            await SaveCart(cart);
        }

        NotifyStateChanged();
    }

    public async Task ClearCart()
    {
        if (_authenticationService.IsAuthenticated)
        {
            try
            {
                await _makerSecureClient.ClearCartAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CartService] Error in ClearCart: {ex}");
            }
        }
        else
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", StorageKey);
        }

        NotifyStateChanged();
    }

    private async Task SaveCart(List<CartItem> cart)
    {
        var json = JsonSerializer.Serialize(cart);
        await _jsRuntime.InvokeVoidAsync("localStorage.setItem", StorageKey, json);
    }

    bool _isSyncing = false;

    public async Task SyncLocalCartToServerIfNeeded()
    {
        if (_isSyncing || !_authenticationService.IsAuthenticated)
            return;
        _isSyncing = true;

        var localCart = await GetLocalCartItems();
        if (localCart.Any())
        {
            try
            {
                // Send to server
                await _makerSecureClient.AddProductsToCartAsync(new AddCartRequest()
                {
                    CartItem = localCart.Select(i => new AddToCartItem { Slug = i.Slug, Quantity = i.Quantity }).ToList()
                });
                // Clear local storage
                await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", StorageKey);
                NotifyStateChanged();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CartService] Error in SyncLocalCartToServerIfNeeded: {ex}");
            }
        }
        _isSyncing = false;
    }

    private async Task<List<CartItem>> GetLocalCartItems()
    {
        var json = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", StorageKey);
        if (string.IsNullOrEmpty(json))
            return new List<CartItem>();

        try
        {
            return JsonSerializer.Deserialize<List<CartItem>>(json) ?? new List<CartItem>();
        }
        catch (JsonException)
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", StorageKey);
            return new List<CartItem>();
        }
    }
}
