import { useState } from 'react';

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  function setPaginationData(data: { total: number; totalPages: number; page: number }) {
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setPage(data.page);
  }

  function resetPage() {
    setPage(1);
  }

  return { page, totalPages, total, setPage, setPaginationData, resetPage };
}
