import { printController } from "../framework/express/printcontroller.js";
import { FuncMetadata } from "../core/type.js";
import { Methods } from "../core/helper.js";

describe("printController", () => {
  const mockUseCases: FuncMetadata[] = [
    {
      name: "getUserData",
      dependencies: [],
      kind: "UseCase",
      decorators: [{ name: "Controller", data: { method: "get" as Methods, path: "/user/data", tag: "User" } }],
    },
    {
      name: "updateUserData",
      dependencies: [],
      kind: "UseCase",
      decorators: [{ name: "Controller", data: { method: "put" as Methods, path: "/user/data", tag: "User" } }],
    },
    {
      name: "deleteUser",
      dependencies: [],
      kind: "UseCase",
      decorators: [{ name: "Controller", data: { method: "delete" as Methods, path: "/user", tag: "User" } }],
    },
    {
      name: "getProductData",
      dependencies: [],
      kind: "UseCase",
      decorators: [{ name: "Controller", data: { method: "get" as Methods, path: "/product/data", tag: "Product" } }],
    },
  ];

  it("should print controller information correctly", () => {
    const result = printController(mockUseCases);

    expect(result).toEqual([
      {
        tag: "USER   ",
        useCase: "Get User Data   ",
        method: "   GET",
        path: "/user/data   ",
      },
      {
        tag: "       ",
        useCase: "Update User Data",
        method: "   PUT",
        path: "/user/data   ",
      },
      {
        tag: "       ",
        useCase: "Delete User     ",
        method: "DELETE",
        path: "/user        ",
      },
      {
        tag: "PRODUCT",
        useCase: "Get Product Data",
        method: "   GET",
        path: "/product/data",
      },
    ]);
  });

  it("should handle an empty array", () => {
    const result = printController([]);
    expect(result).toEqual([]);
  });
});
