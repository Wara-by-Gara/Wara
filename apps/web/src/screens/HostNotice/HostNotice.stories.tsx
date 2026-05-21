import type { Meta, StoryObj } from "@storybook/react";
import { HostNotice } from "./HostNotice";

const meta: Meta<typeof HostNotice> = {
  title: "Pages/21 Host Notice/Page",
  component: HostNotice,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof HostNotice>;

export const List: Story = { args: { screen: "list" } };
export const Empty: Story = { args: { screen: "empty" } };
export const Detail: Story = { args: { screen: "detail" } };
export const CreateEmpty: Story = { args: { screen: "createEmpty" } };
export const CreateFilled: Story = { args: { screen: "createFilled" } };
export const SendConfirm: Story = { args: { screen: "sendConfirm" } };
export const Sending: Story = { args: { screen: "sending" } };
export const SendComplete: Story = { args: { screen: "sendComplete" } };
export const Edit: Story = { args: { screen: "edit" } };
export const DeleteModal: Story = { args: { screen: "deleteModal" } };
export const GuestView: Story = { args: { screen: "guestView" } };
