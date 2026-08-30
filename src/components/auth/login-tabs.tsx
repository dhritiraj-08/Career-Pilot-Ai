"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

export function LoginTabs() {
  return (
    <Tabs defaultValue="signin" className="flex w-full max-w-sm flex-col items-center">
      <TabsList>
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin" className="flex w-full justify-center">
        <SignInForm />
      </TabsContent>
      <TabsContent value="signup" className="flex w-full justify-center">
        <SignUpForm />
      </TabsContent>
    </Tabs>
  );
}
