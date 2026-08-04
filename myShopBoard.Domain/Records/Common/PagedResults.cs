namespace myShopBoard.Domain.Records.Common;
/// <summary>
/// One paging envelope for every list endpoint.
/// </summary>


public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int Size)
{
    public int TotalPages => Size <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)Size);
}