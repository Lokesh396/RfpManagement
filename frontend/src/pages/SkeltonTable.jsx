import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableRow, TableCell } from "@/components/ui/table";
import PropTypes from "prop-types";

function SkeletonTable({ colspan }) {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: colspan }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="w-full h-4 bg-gray-100" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

SkeletonTable.propTypes = {
  colspan: PropTypes.number.isRequired,
};

export default SkeletonTable;
