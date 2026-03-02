"use client";

import { DataTable } from "@/components/ui/data-table";
import { getColumns, TeacherColumn } from "@/components/dashboard/teachers/columns";

export function TeachersDataTable({
    isSuperAdmin,
    schoolsList,
    formattedTeachers
}: {
    isSuperAdmin: boolean,
    schoolsList: { id: string, name: string }[],
    formattedTeachers: TeacherColumn[]
}) {
    return (
        <DataTable
            columns={getColumns({
                isSuperAdmin,
                schools: schoolsList
            })}
            data={formattedTeachers}
            searchKey="full_name"
            filters={[
                { column: "school_name", title: "School Name" },
                { column: "class_section", title: "Class & Section" }
            ]}
        />
    );
}
