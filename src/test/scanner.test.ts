import { Skeleto } from "../core/skeleto.js";
import { FuncInstanceMetadata } from "../core/type.js";

describe("Function Utilities", () => {
  let containers: Map<string, FuncInstanceMetadata>;

  beforeEach(async () => {
    const skeleto = await Skeleto.start("src/test/sample");
    containers = skeleto.getContainer();
  });

  it("should scan the action function", async () => {
    //

    const obj1 = containers.get("ReturnFunc01");

    expect(obj1?.funcMetadata).toEqual({
      name: "ReturnFunc01",
      dependencies: ["DataSource"],
      mainDecorator: {
        name: "Action",
        data: {
          readTypeArguments: true,
        },
      },
      additionalDecorators: [
        {
          name: "YourCustom",
          data: {
            a: 12,
          },
        },
      ],
      returnTypeDecorator: [
        {
          name: "FunctionType01",
          data: {
            a: 4,
          },
        },
        {
          name: "FunctionType02",
          data: {
            b: true,
          },
        },
      ],
      request: {
        name: "Request",
        path: "/Users/mirza/Workspace/skeleto/src/test/sample/test1_file.ts",
        structure: [
          {
            decorators: [
              {
                data: {
                  aa: 1,
                },
                name: "RequestField01",
              },
              {
                data: {
                  ab: 2,
                },
                name: "RequestField02",
              },
            ],
            name: "name",
            type: "string",
          },
          {
            decorators: [
              {
                data: {
                  ac: 3,
                },
                name: "RequestField11",
              },
              {
                data: {
                  ad: 4,
                },
                name: "RequestField12",
              },
            ],
            name: "age",
            type: "number",
          },
        ],
        decorators: [
          {
            name: "RequestType01",
            data: {},
          },
          {
            name: "RequestType02",
            data: "",
          },
        ],
      },
      response: {
        name: "Response",
        path: "/Users/mirza/Workspace/skeleto/src/test/sample/test1_file.ts",
        structure: [
          {
            decorators: [
              {
                data: {
                  ae: 5,
                },
                name: "ResponseField01",
              },
              {
                data: {
                  af: 6,
                },
                name: "ResponseField02",
              },
            ],
            name: "person",
            type: "Person",
          },
          {
            decorators: [
              {
                data: {
                  ag: 7,
                },
                name: "ResponseField11",
              },
              {
                data: {
                  ah: 8,
                },
                name: "ResponseField12",
              },
            ],
            name: "token",
            type: "string",
          },
        ],
        decorators: [
          {
            name: "ResponseType01",
            data: "",
          },
          {
            name: "ResponseType02",
            data: "",
          },
        ],
      },
    });

    const obj2 = containers.get("DataSource");

    expect(obj2?.funcMetadata).toEqual(
      //
      { name: "DataSource", dependencies: [], mainDecorator: { name: "Config", data: "" }, additionalDecorators: [] }
    );

    // console.log(JSON.stringify(obj1));
    // console.log(JSON.stringify(obj2));

    //
  });
});
